import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 20).slice(0, 30);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await auth();
  if (!s?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await db.user.findUnique({ where: { email: s.user.email } });
  const file = await db.file.findFirst({ where: { id, ownerId: u?.id } });
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = z.object({ action: z.enum(["summarize", "flashcards", "quiz"]) }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Action must be summarize, flashcards, or quiz" }, { status: 400 });
  const { action } = parsed.data;
  const sents = sentences(file.textContent || "");
  if (sents.length === 0) return NextResponse.json({ summary: "Not enough text extracted yet. Upload a TXT or MD version for full study tools." });
  if (action === "summarize") {
    return NextResponse.json({
      summary: sents.slice(0, 3).join(" "),
      points: sents.slice(0, 5),
    });
  }
  if (action === "flashcards") {
    const cards = sents.slice(0, 6).map((t, i) => {
      const words = t.split(" ");
      const topic = words.slice(0, 4).join(" ");
      return {
        q: `Key concept ${i + 1}: ${topic}...?`,
        a: t,
      };
    });
    return NextResponse.json({ cards });
  }
  const quiz = sents.slice(0, 4).map((t, i) => ({
    q: `Q${i + 1}: How does the note describe this concept: "${t.slice(0, 80)}..."?`,
    hint: `Review sentence ${i + 1} from your notes`,
    answer: t,
  }));
  return NextResponse.json({ quiz });
}
