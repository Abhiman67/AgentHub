import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ObjectStorage } from "./types";

const ROOT = process.env.LOCAL_STORAGE_DIR ?? "./storage";

export const localStorage: ObjectStorage = {
  async put(key, data) {
    const safe = key.replace(/[^a-zA-Z0-9/_.-]/g, "_");
    const full = path.join(process.cwd(), ROOT, safe);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
    return { key: safe };
  },
  async get(key) {
    try {
      const full = path.join(process.cwd(), ROOT, key.replace(/[^a-zA-Z0-9/_.-]/g, "_"));
      return new Uint8Array(await readFile(full));
    } catch {
      return null;
    }
  },
  async del(key) {
    try {
      await rm(path.join(process.cwd(), ROOT, key.replace(/[^a-zA-Z0-9/_.-]/g, "_")), { force: true });
    } catch {}
  },
};
