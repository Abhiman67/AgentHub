import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { apiError } from "./api-errors";
import { getEnv } from "./env";
import { HttpError, unauthorized } from "./http-error";
import { logError } from "./observability/logger";
import { rateLimitDistributed } from "./rate-limit";

export { HttpError, unauthorized, notFound, forbidden, invalid } from "./http-error";

/** Authenticate + load user id. Throws HttpError; validate env first. */
export async function requireUserId(): Promise<string> {
  getEnv();
  const s = await auth();
  if (!s?.user?.email) throw unauthorized();
  const u = await db.user.findUnique({ where: { email: s.user.email }, select: { id: true } });
  if (!u) throw new HttpError("USER_NOT_FOUND", 404, "User not found.");
  return u.id;
}

export type ApiCtx = { userId: string; requestId: string };
export type RateLimitOpts = { keyPrefix: string; limit: number; windowSec?: number };

/**
 * Route wrapper: provides {userId, requestId}, maps HttpError to the
 * standard envelope, converts unexpected failures to INTERNAL_ERROR
 * without leaking internals. Handlers receive (req, ctx, params?).
 * Pass `rateLimit` to throttle per user (429 + retryable on excess).
 */
export function handleApi(
  fn: (req: Request, ctx: ApiCtx, params: undefined) => Promise<NextResponse | Response>,
  opts?: { rateLimit?: RateLimitOpts }
): (req: Request) => Promise<NextResponse | Response>;
export function handleApi<TParams extends Record<string, string>>(
  fn: (req: Request, ctx: ApiCtx, params: TParams) => Promise<NextResponse | Response>,
  opts?: { rateLimit?: RateLimitOpts }
): (req: Request, routeCtx: { params: Promise<TParams> }) => Promise<NextResponse | Response>;
export function handleApi<TParams extends Record<string, string> | undefined = undefined>(
  fn: (req: Request, ctx: ApiCtx, params: TParams) => Promise<NextResponse | Response>,
  opts?: { rateLimit?: RateLimitOpts }
) {
  return async (req: Request, routeCtx?: { params: Promise<unknown> }) => {
    const requestId = crypto.randomUUID();
    try {
      const userId = await requireUserId();
      if (opts?.rateLimit) {
        const { keyPrefix, limit, windowSec = 60 } = opts.rateLimit;
        const allowed = await rateLimitDistributed(`${keyPrefix}:${userId}`, limit, windowSec);
        if (!allowed) throw new HttpError("RATE_LIMITED", 429, "Too many requests. Slow down and retry.", true);
      }
      const params = (routeCtx?.params ? await routeCtx.params : undefined) as TParams;
      return await fn(req, { userId, requestId }, params);
    } catch (e) {
      if (e instanceof HttpError) {
        if (e.status >= 500) logError("api.error", { requestId, code: e.code });
        return apiError(e.code, e.message, e.status, { details: e.details, retryable: e.retryable, requestId });
      }
      logError("api.error", { requestId, error: e instanceof Error ? e.message : "unknown" });
      return apiError("INTERNAL_ERROR", "Something went wrong.", 500, { retryable: true, requestId });
    }
  };
}
