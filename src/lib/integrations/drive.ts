/**
 * Milestone 8 — Google Drive read-only integration.
 * Minimum scope: drive.readonly. Tokens encrypted at rest (IntegrationAccount),
 * never logged. Without GOOGLE_CLIENT_ID/SECRET the OAuth routes return 501;
 * tests use the mock seam (tokens starting with "mock_").
 */
import { MIN_SCOPES } from "./scopes";

export type DriveFile = { id: string; name: string; mimeType: string; modifiedTime?: string };

const MAX_DOWNLOAD_BYTES = 10 * 1024 * 1024;

function requireOAuthEnv() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth is not configured.");
  return { clientId, clientSecret };
}

export function getDriveRedirectUri(): string {
  const base = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/api/integrations/drive/callback`;
}

export function getDriveAuthUrl(state: string): string {
  const { clientId } = requireOAuthEnv();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getDriveRedirectUri(),
    response_type: "code",
    scope: MIN_SCOPES.drive.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeDriveCode(code: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
  const { clientId, clientSecret } = requireOAuthEnv();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: getDriveRedirectUri(), grant_type: "authorization_code" }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error("Token exchange failed.");
    const data = await res.json();
    if (!data.access_token) throw new Error("Token exchange failed.");
    return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
  } finally {
    clearTimeout(timer);
  }
}

function isMockToken(token: string): boolean {
  return token.startsWith("mock_");
}

export function mockDriveFiles(): DriveFile[] {
  return [
    { id: "mock-file-1", name: "Study Notes.txt", mimeType: "text/plain", modifiedTime: new Date().toISOString() },
    { id: "mock-file-2", name: "Project Plan.md", mimeType: "text/markdown", modifiedTime: new Date().toISOString() },
  ];
}

export async function listDriveFiles(accessToken: string): Promise<DriveFile[]> {
  if (isMockToken(accessToken)) return mockDriveFiles();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    let attempt = 0;
    for (;;) {
      const res = await fetch(
        "https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType,modifiedTime)&orderBy=modifiedTime desc",
        { headers: { Authorization: `Bearer ${accessToken}` }, signal: controller.signal }
      );
      if (res.status === 401) throw new Error("Token expired, reconnect");
      if (res.ok) {
        const data = await res.json();
        return (data.files ?? []).map((f: Record<string, string>) => ({ id: f.id, name: f.name, mimeType: f.mimeType, modifiedTime: f.modifiedTime }));
      }
      if (++attempt > 2) throw new Error("Drive list failed.");
      await new Promise((r) => setTimeout(r, 300 * attempt));
    }
  } finally {
    clearTimeout(timer);
  }
}

export async function downloadDriveFile(accessToken: string, fileId: string): Promise<{ bytes: Uint8Array; name: string; mimeType: string }> {
  if (isMockToken(accessToken)) {
    const meta = mockDriveFiles().find((f) => f.id === fileId);
    if (!meta) throw new Error("Drive file not found.");
    const text = `# ${meta.name}\n\nMock imported study content for ${meta.name}. Replace with a real Drive download once Google OAuth is configured.`;
    return { bytes: new TextEncoder().encode(text), name: meta.name, mimeType: meta.mimeType };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });
    if (metaRes.status === 401) throw new Error("Token expired, reconnect");
    if (!metaRes.ok) throw new Error("Drive file not found.");
    const meta = await metaRes.json();
    const dl = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });
    if (!dl.ok) throw new Error("Drive download failed.");
    const buf = new Uint8Array(await dl.arrayBuffer());
    if (buf.length > MAX_DOWNLOAD_BYTES) throw new Error("Drive file exceeds 10MB.");
    return { bytes: buf, name: meta.name, mimeType: meta.mimeType ?? "application/octet-stream" };
  } finally {
    clearTimeout(timer);
  }
}
