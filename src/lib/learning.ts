/**
 * Evidence-based mastery (master spec §5.3). Mastery is DERIVED from recorded
 * evidence only — never from LLM confidence, never set directly by clients.
 * States: unknown → learning → practiced → confident, plus needs_review.
 */
export type MasteryState = "unknown" | "learning" | "practiced" | "confident" | "needs_review";

export type Evidence = {
  kind: string;
  score: number | null;
  total: number | null;
  note: string;
  createdAt: number;
};

export function deriveMastery(evidences: Evidence[]): MasteryState {
  if (evidences.length === 0) return "unknown";
  const sorted = [...evidences].sort((a, b) => a.createdAt - b.createdAt);
  const latest = sorted[sorted.length - 1];
  if (latest.kind === "self_review" && /weak|stuck|confus/i.test(latest.note)) return "needs_review";
  if (latest.kind === "self_review" && /confident|solid|mastered/i.test(latest.note)) return "confident";
  const scored = sorted.filter((e) => e.score !== null && e.total && e.total > 0);
  if (scored.length === 0) return latest.kind === "session" ? "learning" : "practiced";
  const pct = (e: (typeof scored)[number]) => (e.score! / e.total!) * 100;
  const last = pct(scored[scored.length - 1]);
  const recent = scored.slice(-3);
  const strong = recent.filter((e) => pct(e) >= 80).length;
  if (strong >= 2 && last >= 80) return "confident";
  if (last >= 80) return "practiced";
  if (last >= 60) return "practiced";
  return "learning";
}

export type PlanSession = { title: string; dayOffset: number; durationMin: number; topicIds: string[] };

/**
 * Deterministic revision planner: weakest topics first, spread evenly across
 * available days until the exam (default 7). Pure and testable.
 */
export function planRevision(topicIds: string[], masteryById: Record<string, MasteryState>, daysAvailable: number, minutesPerDay = 45): PlanSession[] {
  if (topicIds.length === 0 || daysAvailable < 1) return [];
  const weight: Record<MasteryState, number> = { unknown: 3, needs_review: 3, learning: 2, practiced: 1, confident: 0 };
  const ordered = [...topicIds].sort((a, b) => (weight[masteryById[b] ?? "unknown"] ?? 0) - (weight[masteryById[a] ?? "unknown"] ?? 0));
  const days = Math.min(daysAvailable, 14);
  const sessions: PlanSession[] = [];
  ordered.forEach((id, i) => {
    const day = i % days;
    const existing = sessions.find((s) => s.dayOffset === day);
    if (existing) existing.topicIds.push(id);
    else sessions.push({ title: `Revision day ${day + 1}`, dayOffset: day, durationMin: minutesPerDay, topicIds: [id] });
  }
  );
  return sessions.sort((a, b) => a.dayOffset - b.dayOffset);
}
