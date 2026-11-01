"use client";
import { useCallback, useEffect, useRef, useState } from "react";
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
            type="button"
            onClick={() => {
              setFlipped(false);
              setIndex((i) => (i > 0 ? i - 1 : cards.length - 1));
            }}
            className="tag"
            aria-label="Previous flashcard"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => {
              setFlipped(false);
              setIndex((i) => (i < cards.length - 1 ? i + 1 : 0));
            }}
            className="tag"
            aria-label="Next flashcard"
          >
            Next
          </button>
        </div>
      </div>
      <div
        onClick={() => setFlipped(!flipped)}
        style={{
          minHeight: 110,
          background: "var(--color-paper)",
          border: "1px solid var(--color-line)",
          borderRadius: 14,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          textAlign: "center",
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
            <p style={{ fontSize: 12, background: "var(--color-paper)", border: "1px solid var(--color-line)", padding: 8, borderRadius: 8, marginTop: 8 }}>
              Hint: {q.hint}
            </p>
          )}
          {revealed[i] && q.answer && (
            <p style={{ fontSize: 12, background: "var(--color-paper)", border: "1px solid var(--color-line)", padding: 8, borderRadius: 8, marginTop: 8 }}>
              Answer: {q.answer}
            </p>
          )}
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            {q.hint && (
              <button
                type="button"
                onClick={() => setHints((h) => ({ ...h, [i]: !h[i] }))}
                className="tag"
                aria-pressed={Boolean(hints[i])}
              >
                {hints[i] ? "Hide hint" : "Hint"}
              </button>
            )}
            {q.answer && (
              <button
                type="button"
                onClick={() => setRevealed((r) => ({ ...r, [i]: !r[i] }))}
                className="tag"
                aria-pressed={Boolean(revealed[i])}
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
  const [loadError, setLoadError] = useState("");
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [openPreview, setOpenPreview] = useState<string | null>(null);
  const [activeStudy, setActiveStudy] = useState<Record<string, string | null>>({});
  const [studyData, setStudyData] = useState<Record<string, StudyData>>({});
  const [fileToDelete, setFileToDelete] = useState<FileRow | null>(null);
  const [deletingFile, setDeletingFile] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [draggingFile, setDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/files");
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : data.error?.message ?? "Could not load your files.");
      setFiles(data.files ?? []);
      setLoadError("");
    } catch {
      setLoadError("We couldn't load your files.");
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function uploadFile(f?: File) {
    if (!f) return;
    setError("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", f);
    try {
      const res = await fetch("/api/files", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : data.error?.message ?? "Upload failed. Please try again.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function upload(e: React.ChangeEvent<HTMLInputElement>) {
    void uploadFile(e.target.files?.[0]);
  }

  function handleDrop(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
    setDraggingFile(false);
    void uploadFile(e.dataTransfer.files?.[0]);
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
      <div className="page-head files-page-head">
        <div>
          <h1>Files & notes</h1>
          <p>Keep your study materials together and give your agents useful context.</p>
        </div>
        <button type="button" className="button primary sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? "Uploading…" : "Upload a file"}
        </button>
      </div>

      <input ref={fileInputRef} className="file-input-hidden" type="file" onChange={upload} accept=".pdf,.txt,.md,.docx" aria-label="Choose a study file to upload" />

      <section
        className={`files-dropzone${draggingFile ? " is-over" : ""}${uploading ? " is-uploading" : ""}`}
        aria-label="Upload study materials"
        onDragEnter={(e) => { e.preventDefault(); setDraggingFile(true); }}
        onDragOver={(e) => { e.preventDefault(); setDraggingFile(true); }}
        onDragLeave={(e) => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDraggingFile(false); }}
        onDrop={handleDrop}
      >
        <div className="files-dropzone-icon" aria-hidden="true">↥</div>
        <h2>{uploading ? "Uploading your file…" : draggingFile ? "Drop to upload" : "Add notes and study materials"}</h2>
        <p>{uploading ? "Keep this page open while we add it to your workspace." : "Drag a file here, or choose one from your device."}</p>
        <button type="button" className="button secondary sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          Browse files
        </button>
        <span className="files-dropzone-meta">PDF, TXT, MD or DOCX <span aria-hidden="true">·</span> up to 10 MB</span>
      </section>

      {error && <p className="files-error" role="alert">{error}</p>}

      <section className="panel files-list-panel">
        <div className="panel-head">
          <h2>Recent files</h2>
          <span className="tag">{files.length} files</span>
        </div>
        {loadingFiles && <p className="files-list-message">Loading your files…</p>}
        {!loadingFiles && loadError && <div className="files-list-message"><span>{loadError}</span><button type="button" className="files-retry" onClick={() => void load()}>Try again</button></div>}
        {!loadingFiles && !loadError && files.length === 0 && <div className="files-empty-state"><strong>No files yet</strong><span>Your uploaded notes and study materials will show up here.</span></div>}

        {!loadError && files.map((f) => {
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
                <span className="tag">{f.status}</span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, paddingLeft: 46 }}>
                <button
                  type="button"
                  onClick={() => togglePreview(f.id)}
                  className="tag"
                  aria-pressed={openPreview === f.id}
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
                    type="button"
                    onClick={() => toggleStudy(f.id, a)}
                    className="tag"
                    aria-pressed={activeAction === a}
                  >
                    {l}
                  </button>
                ))}
                <Link href="/app/agents" className="tag" style={{ textDecoration: "none" }}>Ask</Link>
                <button
                  type="button"
                  onClick={() => setFileToDelete(f)}
                  aria-label={`Delete ${f.name}`}
                  className="link-danger"
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
