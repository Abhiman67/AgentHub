import type { ObjectStorage } from "./types";
import { localStorage } from "./local";
import { logInfo } from "@/lib/observability/logger";

// S3-compatible stub: uses env when present, otherwise local disk.
// Keeps the storage interface stable so production can swap the driver
// without changing the file pipeline.
const bucket = process.env.S3_BUCKET;
const endpoint = process.env.S3_ENDPOINT ?? "";

export const objectStorage: ObjectStorage = {
  async put(key, data, contentType) {
    if (!bucket || !process.env.S3_ACCESS_KEY) {
      return localStorage.put(key, data, contentType);
    }
    logInfo("s3.put", { key, bytes: data.length, endpoint: endpoint || "default" });
    // Minimal S3 PUT via fetch (path-style). Falls back to local on failure.
    try {
      const res = await fetch(`${endpoint}/${bucket}/${encodeURIComponent(key)}`, {
        method: "PUT",
        headers: { "Content-Type": contentType ?? "application/octet-stream" },
        body: data as unknown as BodyInit,
      });
      if (!res.ok) throw new Error(`S3 PUT ${res.status}`);
      return { key };
    } catch {
      return localStorage.put(key, data, contentType);
    }
  },
  get(key) {
    return localStorage.get(key);
  },
  del(key) {
    return localStorage.del(key);
  },
};

export function storageKeyFor(ownerId: string, fileId: string, name: string) {
  const clean = (s: string) => s.replace(/\.\./g, "_").replace(/[^a-zA-Z0-9_.-]/g, "_");
  return `${clean(ownerId)}/${clean(fileId)}/${clean(name)}`;
}
