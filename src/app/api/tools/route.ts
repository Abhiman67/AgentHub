import { NextResponse } from "next/server";
import { listTools } from "@/lib/tools/registry";
import { handleApi } from "@/lib/api";

export const GET = handleApi(async () => {
  return NextResponse.json({ tools: listTools() }, { headers: { "Cache-Control": "no-store" } });
});
