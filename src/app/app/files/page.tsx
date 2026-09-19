"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/Dialog";

type FileRow = { id: string; name: string; status: string; size: number };

type StudyData = {
  summary?: string;
  points?: string[];
  cards?: { q: string; a: string }[];
  quiz?: { q: string; hint?: string; answer?: string }[];
};

function ext(name: string): [string, string] {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return ["PDF", "yellow"];
  if (n.endsWith(".md")) return ["MD", "blue"];
  if (n.endsWith(".docx")) return ["DOC", "lav"];
  return ["TXT", "green"];
}

function fmt(size: number) {
  if (size > 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(size / 1024)} KB`;
}

function FlashcardDeck({ cards }: { cards: { q: string; a: string }[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (cards.length === 0) return <p className="text-sm text-muted">No flashcards generated.</p>;

  const current = cards[index] ?? cards[0];

  return (
    <div className="mt-3 rounded-2xl border border-line bg-card p-4">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span className="text-xs font-bold text-muted">
          Flashcard {index + 1} of {cards.length}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => {
              setFlipped(false);
              setIndex((i) => (i > 0 ? i - 1 : cards.length - 1));
            }}
            className="tag"
            style={{ cursor: "pointer", border: 0 }}
          >
            ← Prev
          </button>
          <button
            onClick={() => {
              setFlipped(false);
              setIndex((i) => (i < cards.length - 1 ? i + 1 : 0));
            }}
            className="tag"
            style={{ cursor: "pointer", border: 0 }}
          >
            Next →
          </button>
        </div>
      </div>
      <div
        onClick={() => setFlipped(!flipped)}
        style={{
          minHeight: 110,
          background: flipped ? "#f5fbf3" : "var(--color-paper)",
          border: flipped ? "1px solid #c0e3ba" : "1px solid var(--color-line)",
          borderRadius: 14,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          textAlign: "center",
          transition: "all 0.2s ease",
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-muted)", marginBottom: 6 }}>
          {flipped ? "Answer (Click to flip)" : "Question (Click to flip)"}
        </span>
        <p style={{ fontSize: 14, fontWeight: flipped ? 600 : 700, margin: 0, color: "var(--color-ink)" }}>
          {flipped ? current.a : current.q}
        </p>
      </div>
    </div>
  );
}

function QuizDeck({ questions }: { questions: { q: string; hint?: string; answer?: string }[] }) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [hints, setHints] = useState<Record<number, boolean>>({});

  return (
    <div className="mt-3 space-y-3">
      {questions.map((q, i) => (
        <div key={i} className="rounded-2xl border border-line bg-card p-4">
          <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{q.q}</p>
          {hints[i] && q.hint && (
            <p style={{ fontSize: 12, color: "#a06000", background: "#fff9eb", padding: 8, borderRadius: 8, marginTop: 8 }}>
              💡 Hint: {q.hint}
            </p>
          )}
          {revealed[i] && q.answer && (
            <p style={{ fontSize: 12, color: "#1e6022", background: "#f0f8ed", padding: 8, borderRadius: 8, marginTop: 8 }}>
              ✓ Answer: {q.answer}
            </p>
          )}
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            {q.hint && (
              <button
                onClick={() => setHints((h) => ({ ...h, [i]: !h[i] }))}
                className="tag"
                style={{ cursor: "pointer", border: 0, fontSize: 11 }}
              >
                {hints[i] ? "Hide hint" : "Hint"}
              </button>
            )}
            {q.answer && (
              <button
                onClick={() => setRevealed((r) => ({ ...r, [i]: !r[i] }))}
                className="tag"
                style={{ cursor: "pointer", border: 0, fontSize: 11, background: revealed[i] ? "var(--color-line)" : "var(--color-brand)", color: revealed[i] ? "inherit" : "white" }}
              >
                {revealed[i] ? "Hide answer" : "Show answer"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [error, setError] = useState("");
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [openPreview, setOpenPreview] = useState<string | null>(null);
  const [activeStudy, setActiveStudy] = useState<Record<string, string | null>>({});
  const [studyData, setStudyData] = useState<Record<string, StudyData>>({});
  const [fileToDelete, setFileToDelete] = useState<FileRow | null>(null);
  const [deletingFile, setDeletingFile] = useState(false);

  const load = () => fetch("/api/files").then((r) => r.json()).then((d) => setFiles(d.files ?? []));
  useEffect(() => { load(); }, []);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch("/api/files", { method: "POST", body: fd });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Upload failed. Your data is safe.");
    }
    load();
  }

  async function handleConfirmDelete() {
    if (!fileToDelete) return;
    setDeletingFile(true);
    try {
      await fetch(`/api/files/${fileToDelete.id}`, { method: "DELETE" });
      setFileToDelete(null);
      load();
    } finally {
      setDeletingFile(false);
    }
  }

  async function toggleStudy(id: string, action: string) {
    const current = activeStudy[id];
    if (current === action) {
      setActiveStudy((s) => ({ ...s, [id]: null }));
      return;
    }
    setActiveStudy((s) => ({ ...s, [id]: action }));
    const cacheKey = id + ":" + action;
    if (!studyData[cacheKey]) {
      const res = await fetch(`/api/files/${id}/study`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      setStudyData((s) => ({ ...s, [cacheKey]: data }));
    }
  }

  async function togglePreview(id: string) {
    if (openPreview === id) {
      setOpenPreview(null);
      return;
    }
    if (!previews[id]) {
      const res = await fetch(`/api/files/${id}`);
      const d = await res.json();
      setPreviews((p) => ({ ...p, [id]: d.file?.textContent ?? "No extracted text available." }));
    }
    setOpenPreview(id);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Files & notes</h1>
          <p>Give your agents the context they need to help you better.</p>
        </div>
        <label className="button" style={{ cursor: "pointer" }}>
          ↥ Upload files
          <input type="file" hidden onChange={upload} accept=".pdf,.txt,.md,.docx" aria-label="Upload study file" />
        </label>
      </div>

      <label className="panel dropzone" style={{ display: "block", cursor: "pointer" }}>
        <div className="big">↥</div>
        <h2>Drop your notes here</h2>
        <p>PDF, TXT, MD and DOCX files up to 10 MB.</p>
        <input type="file" hidden onChange={upload} accept=".pdf,.txt,.md,.docx" aria-label="Browse files" />
        <span className="button light" style={{ display: "inline-flex" }}>Browse files</span>
      </label>

      {error && <p className="mt-2 text-sm" role="alert" style={{ color: "#c0392b" }}>{error}</p>}

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel-head">
          <h2>Recent files</h2>
          <span className="tag">{files.length} files</span>
        </div>
        {files.length === 0 && <p style={{ fontSize: 13, color: "var(--color-muted)" }}>No files yet. Upload notes and ask Study Coach.</p>}

        {files.map((f) => {
          const [label, color] = ext(f.name);
          const activeAction = activeStudy[f.id];
          const currentStudy = activeAction ? studyData[f.id + ":" + activeAction] : undefined;

          return (
            <div key={f.id} style={{ borderBottom: "1px solid var(--color-line)", paddingBottom: 16, marginBottom: 16 }}>
              <div className="list-row" style={{ borderBottom: 0, paddingBottom: 6 }}>
                <div className={`agent-icon ${color}`} style={{ margin: 0, fontSize: 11, fontWeight: 800 }}>{label}</div>
                <div className="grow">
                  <b>{f.name}</b>
                  <small>{fmt(f.size)} · {f.status}</small>
                </div>
                <span className="status">● {f.status}</span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, paddingLeft: 46 }}>
                <button
                  onClick={() => togglePreview(f.id)}
                  className="tag"
                  style={{ cursor: "pointer", border: 0, background: openPreview === f.id ? "var(--color-line)" : undefined }}
                >
                  {openPreview === f.id ? "Close preview" : "Preview"}
                </button>
                {[
                  ["summarize", "Summarize"],
                  ["flashcards", "Flashcards"],
                  ["quiz", "Quiz"],
                ].map(([a, l]) => (
                  <button
                    key={a}
                    onClick={() => toggleStudy(f.id, a)}
                    className="tag"
                    style={{
                      cursor: "pointer",
                      border: 0,
                      background: activeAction === a ? "var(--color-brand)" : undefined,
                      color: activeAction === a ? "white" : undefined,
                      fontWeight: activeAction === a ? 700 : 600,
                    }}
                  >
                    {l}
                  </button>
                ))}
                <Link href="/app/agents" className="tag" style={{ textDecoration: "none" }}>Ask →</Link>
                <button
                  type="button"
                  onClick={() => setFileToDelete(f)}
                  aria-label={`Delete ${f.name}`}
                  className="tag"
                  style={{ cursor: "pointer", border: 0, color: "#c0392b" }}
                >
                  Delete
                </button>
              </div>

              {openPreview === f.id && (
                <div style={{ marginTop: 10, marginLeft: 46, padding: 12, background: "var(--color-paper)", borderRadius: 12, border: "1px solid var(--color-line)" }}>
                  <p style={{ fontSize: 12, color: "var(--color-ink)", whiteSpace: "pre-wrap", maxHeight: 200, overflowY: "auto", margin: 0 }}>
                    {previews[f.id] || "Loading preview…"}
                  </p>
                </div>
              )}

              {activeAction && currentStudy && (
                <div style={{ marginLeft: 46 }}>
                  {activeAction === "summarize" && (
                    <div style={{ marginTop: 10, padding: 14, background: "var(--color-paper)", borderRadius: 14, border: "1px solid var(--color-line)" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 6px" }}>Key Summary</p>
                      <p style={{ fontSize: 13, margin: "0 0 10px", lineHeight: 1.5 }}>{currentStudy.summary}</p>
                      {currentStudy.points && currentStudy.points.length > 0 && (
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "var(--color-ink)", lineHeight: 1.6 }}>
                          {currentStudy.points.map((pt, idx) => (
                            <li key={idx}>{pt}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {activeAction === "flashcards" && (
                    <FlashcardDeck cards={currentStudy.cards ?? []} />
                  )}

                  {activeAction === "quiz" && (
                    <QuizDeck questions={currentStudy.quiz ?? []} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>

      <ConfirmDialog
        isOpen={Boolean(fileToDelete)}
        onClose={() => setFileToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete "${fileToDelete?.name}"?`}
        description="Are you sure you want to delete this file? This will permanently remove it from your workspace, lecture context, and flashcard sets."
        confirmText="Delete File"
        cancelText="Cancel"
        variant="danger"
        loading={deletingFile}
      />
    </>
  );
}
