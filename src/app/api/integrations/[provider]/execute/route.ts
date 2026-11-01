import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ADAPTERS } from "@/lib/integrations/mcp-client";
import { handleApi, HttpError, invalid } from "@/lib/api";

const bodySchema = z.object({
  capability: z.string().min(1).max(80),
  input: z.record(z.string(), z.unknown()).default({}),
  approvalId: z.string().min(1).optional(),
  requiresExternalWrite: z.boolean().optional(),
});

export const POST = handleApi<{ provider: string }>(async (req, { userId }, params) => {
  const { provider } = params;
  const adapter = ADAPTERS[provider.toLowerCase()];
  if (!adapter) throw new HttpError("UNKNOWN_PROVIDER", 400, "Unknown provider");
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw invalid("Invalid input");
  if (parsed.data.requiresExternalWrite && parsed.data.approvalId) {
    const ap = await db.approval.findFirst({ where: { id: parsed.data.approvalId, ownerId: userId, status: "approved" } });
    if (!ap) throw new HttpError("APPROVAL_REQUIRED", 403, "Valid approved approval required");
  }
  const result = await adapter.execute(
    { capability: parsed.data.capability, input: parsed.data.input, requiresExternalWrite: parsed.data.requiresExternalWrite },
    { ownerId: userId, approvalId: parsed.data.approvalId }
  );
  if (!result.ok) throw new HttpError("INTEGRATION_FAILED", 400, result.error ?? "Integration failed");
  return NextResponse.json({ result: result.data });
}, {
  rateLimit: { keyPrefix: "integration", limit: 20 },
});
