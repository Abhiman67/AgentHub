export type Capability = { name: string; kind: "read" | "draft" };
export type IntegrationRequest = { capability: string; input: Record<string, unknown>; requiresExternalWrite?: boolean };
export type IntegrationResult = { ok: boolean; data?: unknown; error?: string };

export type IntegrationContext = { ownerId?: string; approvalId?: string };

export type IntegrationAdapter = {
  provider: string;
  listCapabilities(): Promise<Capability[]>;
  execute(input: IntegrationRequest, ctx?: IntegrationContext): Promise<IntegrationResult>;
};
