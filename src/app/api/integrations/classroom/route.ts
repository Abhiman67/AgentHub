import { NextResponse } from "next/server";
import { connectProvider, disconnectProvider } from "@/lib/integrations/accounts";
import { handleApi } from "@/lib/api";

/** Connects the Classroom adapter in preview mode until Google OAuth is configured. */
export const POST = handleApi(async (_, { userId }) => {
  const account = await connectProvider(userId, "classroom");
  return NextResponse.json({
    account: { provider: account.provider, scopes: account.scopes, updatedAt: account.updatedAt },
    demo: true,
  }, { status: 201 });
});

export const DELETE = handleApi(async (_, { userId }) => {
  await disconnectProvider(userId, "classroom");
  return NextResponse.json({ ok: true });
});
