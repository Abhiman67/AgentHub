import { NextResponse } from "next/server";
import { handleApi } from "@/lib/api";
import { syncClassroomTasks } from "@/lib/integrations/classroom-sync";

export const POST = handleApi(async (_, { userId }) => NextResponse.json(await syncClassroomTasks(userId), { headers: { "Cache-Control": "no-store" } }));
