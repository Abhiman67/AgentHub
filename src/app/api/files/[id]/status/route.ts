import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApi, notFound } from "@/lib/api";

export const GET = handleApi<{ id: string }>(async (_req, { userId }, params) => {
  const { id } = params;
  const file = await db.file.findFirst({ where: { id, ownerId: userId }, select: { id: true, status: true, name: true } });
  if (!file) throw notFound("File");
  return NextResponse.json(file);
});
