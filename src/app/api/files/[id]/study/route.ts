import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { handleApi, invalid, notFound } from "@/lib/api";

function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 20).slice(0, 30);
}

export const POST = handleApi<{ id: string }>(async (req, { userId }, params) => {
  const { id } = params;
  const file = await db.file.findFirst({ where: { id, ownerId: userId } });
  if (!file) throw notFound("File");
  const parsed = z.object({ action: z.enum(["summarize", "flashcards", "quiz"]) }).safeParse(await req.json());
  if (!parsed.success) throw invalid("Action must be summarize, flashcards, or quiz");
  const { action } = parsed.data;
  const sents = sentences(file.textContent || "");
  if (sents.length === 0) return NextResponse.json({ summary: "Not enough text extracted yet. Upload a TXT or MD version for full study tools." });
  const linkedTopic = file.subjectId ? await db.topic.findFirst({ where: { subjectId: file.subjectId, ownerId: userId }, orderBy: { position: "asc" } }) : null;
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
    if (linkedTopic) await db.masteryEvidence.create({ data: { ownerId: userId, topicId: linkedTopic.id, kind: "flashcards", note: `Generated from ${file.name}` } });
    return NextResponse.json({ cards, source: { id: file.id, label: file.name }, linkedTopicId: linkedTopic?.id ?? null });
  }
  const quiz = sents.slice(0, 4).map((t, i) => ({
    q: `Q${i + 1}: How does the note describe this concept: "${t.slice(0, 80)}..."?`,
    hint: `Review sentence ${i + 1} from your notes`,
    answer: t,
  }));
  if (linkedTopic) await db.masteryEvidence.create({ data: { ownerId: userId, topicId: linkedTopic.id, kind: "quiz", note: `Generated from ${file.name}; record a score after practice.` } });
  return NextResponse.json({ quiz, source: { id: file.id, label: file.name }, linkedTopicId: linkedTopic?.id ?? null });
});
