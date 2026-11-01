import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getQuota } from "@/lib/quotas";
import { downloadDriveFile } from "@/lib/integrations/drive";
import { decryptToken } from "@/lib/integrations/crypto";
import { objectStorage, storageKeyFor } from "@/lib/storage";
import "@/lib/jobs/processors";
import { enqueue } from "@/lib/jobs/queue";
import { handleApi, HttpError, invalid } from "@/lib/api";

const bodySchema = z.object({ fileId: z.string().min(1).max(256) });
const ALLOWED = [".pdf", ".txt", ".md", ".docx"];

export const POST = handleApi(async (req, { userId }) => {
  const quota = await getQuota(userId, "files");
  if (!quota.allowed) throw new HttpError("QUOTA_EXCEEDED", 402, "File quota exceeded", false, { quota });
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw invalid("Invalid input.");

  const acct = await db.integrationAccount.findUnique({ where: { ownerId_provider: { ownerId: userId, provider: "drive" } } });
  if (!acct?.accessTokenEncrypted) throw new HttpError("DRIVE_NOT_CONNECTED", 404, "Drive not connected.");
  if (acct.expiresAt && acct.expiresAt.getTime() < Date.now()) throw new HttpError("TOKEN_EXPIRED", 401, "Token expired, reconnect");

  let dl;
  try {
    dl = await downloadDriveFile(decryptToken(acct.accessTokenEncrypted), parsed.data.fileId);
  } catch (e) {
    throw new HttpError("DRIVE_IMPORT_FAILED", 502, e instanceof Error ? e.message : "Drive import failed.");
  }
  const lower = dl.name.toLowerCase();
  if (!ALLOWED.some((ext) => lower.endsWith(ext))) throw invalid("Only PDF, TXT, MD or DOCX imports.");
  if (dl.bytes.length > 10 * 1024 * 1024) throw new HttpError("FILE_TOO_LARGE", 413, "Max 10MB.");

  const key = storageKeyFor(userId, crypto.randomUUID(), dl.name);
  await objectStorage.put(key, dl.bytes, dl.mimeType);
  const saved = await db.file.create({
    data: { ownerId: userId, name: dl.name, mimeType: dl.mimeType, size: dl.bytes.length, status: "uploaded", textContent: "", storageKey: key },
  });
  try {
    await enqueue("file.extract", { fileId: saved.id, ownerId: userId }, { idempotencyKey: `file.extract:${saved.id}` });
  } catch {
    await db.file.update({ where: { id: saved.id }, data: { status: "failed", failureReason: "EXTRACT_FAILED" } });
  }
  const final = await db.file.findUnique({ where: { id: saved.id } });
  return NextResponse.json({ file: final ?? saved }, { status: 201 });
}, {
  rateLimit: { keyPrefix: "drive-import", limit: 10 },
});
