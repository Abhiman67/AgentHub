declare module "pako" {
  const pako: {
    inflate(data: Uint8Array | string, options?: { to?: "string" }): string;
    deflate(data: Uint8Array | string): Uint8Array;
  };
  export default pako;
}
