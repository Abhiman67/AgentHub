export type StoragePutResult = { key: string };

export interface ObjectStorage {
  put(key: string, data: Uint8Array, contentType?: string): Promise<StoragePutResult>;
  get(key: string): Promise<Uint8Array | null>;
  del(key: string): Promise<void>;
}
