"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ConfirmDialog, Dialog } from "@/components/Dialog";
import Dropdown from "@/components/Dropdown";

type Application = {
  id: string;
  company: string;
  role: string;
  url: string;
  status: string;
  notes: string;
};

type FileRow = {
  id: string;
  name: string;
};

type AnalysisResult = {
  atsScore?: number;
  matchTier?: string;
  skills?: string[];
  strengths?: string[];
  missing?: string[];
  plan?: string[];
  interviewQuestions?: string[];
  note?: string;
};

const STAGES = [
  { id: "saved", title: "Saved / Wishlist", color: "#6f777f", dot: "#9a978f" },
  { id: "preparing", title: "Preparing", color: "#0ea5c6", dot: "#0ea5c6" },
  { id: "applied", title: "Applied", color: "#17633f", dot: "#06402b" },
  { id: "interviewing", title: "Interviewing", color: "#8057c8", dot: "#8057c8" },
  { id: "offer", title: "Offer Received", color: "#2d6325", dot: "#3b7e32" },
  { id: "rejected", title: "Archived", color: "#929089", dot: "#b0aba2" },
] as const;

const STATUSES = STAGES.map((s) => s.id);

const ROLES = [
  { value: "frontend", label: "Frontend Engineer" },
  { value: "backend", label: "Backend Engineer" },
  { value: "fullstack", label: "Full Stack Engineer" },
  { value: "data", label: "Data Analyst / Engineer" },
  { value: "mobile", label: "Mobile App Developer" },
  { value: "devops", label: "DevOps / Cloud" },
];

type CareerGoal = {
  id: string; title: string; targetRole: string; status: string; deadline: string | null;
};

export default function CareerPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [goals, setGoals] = useState<CareerGoal[]>([]);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalRole, setGoalRole] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [url, setUrl] = useState("");
  const [initialStatus, setInitialStatus] = useState<string>("saved");
  const [resumeId, setResumeId] = useState("");
  const [targetRole, setTargetRole] = useState("frontend");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [draft, setDraft] = useState("");
  const [draftingApp, setDraftingApp] = useState<Application | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [copied, setCopied] = useState(false);

  // View Mode: Kanban vs List
  const [trackerMode, setTrackerMode] = useState<"kanban" | "list">("kanban");

  // Modals & Active State
  const [editingNotesApp, setEditingNotesApp] = useState<Application | null>(null);
  const [notesText, setNotesText] = useState("");
  const [deletingApp, setDeletingApp] = useState<Application | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Drag & Drop State
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const load = () => {
    fetch("/api/applications").then((r) => r.json()).then((d) => setApps(d.applications ?? []));
    fetch("/api/files").then((r) => r.json()).then((d) => setFiles(d.files ?? []));
    fetch("/api/career/goals").then((r) => r.json()).then((d) => setGoals(d.goals ?? [])).catch(() => undefined);
  };

  async function createGoal() {
    if (!goalTitle.trim()) return;
    await fetch("/api/career/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: goalTitle.trim(), targetRole: goalRole.trim() || undefined }),
    });
    setGoalTitle("");
    setGoalRole("");
    load();
  }

  async function advanceGoal(g: CareerGoal) {
    const next = g.status === "active" ? "paused" : g.status === "paused" ? "active" : g.status;
    if (next === g.status) return;
    await fetch(`/api/career/goals/${g.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    load();
  }

  useEffect(() => { load(); }, []);

  async function create(stageOverride?: string) {
    if (!company.trim() || !role.trim()) return;
    await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: company.trim(),
        role: role.trim(),
        url: url.trim() || undefined,
        status: stageOverride || initialStatus,
      }),
    });
    setCompany("");
    setRole("");
    setUrl("");
    setInitialStatus("saved");
    load();
  }

  async function move(id: string, status: string) {
    // Optimistic update
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    await fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  function nudgeStage(a: Application, direction: "next" | "prev") {
    const currentIndex = STATUSES.indexOf(a.status as any);
    if (currentIndex === -1) return;
    const targetIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= 0 && targetIndex < STATUSES.length) {
      move(a.id, STATUSES[targetIndex]);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingApp) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/applications?id=${deletingApp.id}`, { method: "DELETE" });
      setDeletingApp(null);
      load();
    } finally {
      setIsDeleting(false);
    }
  }

  async function saveNotes() {
    if (!editingNotesApp) return;
    await fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingNotesApp.id, notes: notesText }),
    });
    setEditingNotesApp(null);
    load();
  }

  async function analyze() {
    const res = await fetch("/api/career/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId: resumeId || undefined, targetRole }),
    });
    setAnalysis(await res.json());
  }

  async function coverLetter(app: Application) {
    setDraftingApp(app);
    setIsDrafting(true);
    try {
      const res = await fetch("/api/career/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: app.id }),
      });
      const d = await res.json();
      setDraft(d.draft ?? "");
    } finally {
      setIsDrafting(false);
    }
  }

  // Group applications by stage for the Kanban board
  const appsByStage = useMemo(() => {
    const map: Record<string, Application[]> = {
      saved: [],
      preparing: [],
      applied: [],
      interviewing: [],
      offer: [],
      rejected: [],
    };
    for (const a of apps) {
      if (map[a.status]) {
        map[a.status].push(a);
      } else {
        map.saved.push(a);
      }
    }
    return map;
  }, [apps]);

  const active = apps.filter((a) => !["offer", "rejected"].includes(a.status)).length;
  const strength = analysis ? Math.min(60 + (analysis.skills?.length ?? 0) * 5, 98) : 76;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Career center</h1>
          <p>Track applications on your Kanban board, analyze skill gaps, and draft cover letters with Career Scout.</p>
        </div>
      </div>

      <div className="grid">
        <section className="card">
          <span className="tag" style={{ background: "#e4f0df", color: "#2d6325" }}>Profile strength</span>
          <h2 style={{ fontSize: 36, marginTop: 14 }}>{strength}%</h2>
          <p style={{ fontSize: 13, lineHeight: 1.5 }}>
            {analysis
              ? `Skills found: ${analysis.skills?.join(", ") || "none"}. Missing: ${analysis.missing?.join(", ") || "none"}.`
              : "Analyze your resume against target roles to uncover matching keywords and gaps."}
          </p>
          <div className="progress" style={{ marginTop: 12 }}>
            <i style={{ width: `${strength}%`, background: "#91be89" }} />
          </div>
        </section>

        <section className="card">
          <span className="tag" style={{ background: "#dff3f5", color: "#25626d" }}>Tracked Roles</span>
          <h2 style={{ fontSize: 36, marginTop: 14 }}>{apps.length} roles</h2>
          <p style={{ fontSize: 13, lineHeight: 1.5 }}>Career Scout monitors your opportunities across all Kanban pipeline stages.</p>
        </section>

        <section className="card">
          <span className="tag" style={{ background: "#ffe0d6", color: "#c95938" }}>In Progress</span>
          <h2 style={{ fontSize: 36, marginTop: 14 }}>{active} active</h2>
          <p style={{ fontSize: 13, lineHeight: 1.5 }}>
            {active ? `${active} applications currently moving through your hiring funnel.` : "Save your first job or internship below."}
          </p>
        </section>
      </div>

      {/* Career goals */}
      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel-head">
          <h2>Career goals</h2>
          <span className="tag">{goals.filter((g) => g.status === "active").length} active</span>
        </div>
        {goals.length === 0 && <p style={{ fontSize: 13, color: "var(--color-muted)" }}>No goals yet — set a target role to focus applications and prep.</p>}
        {goals.slice(0, 5).map((g) => (
          <div key={g.id} className="focus">
            <div className="focus-body">
              <b><Link href={`/app/career/${g.id}`}>{g.title}</Link></b>
              <p>{g.targetRole || "No target role"} · {g.status}{g.deadline ? ` · Due ${new Date(g.deadline).toLocaleDateString()}` : ""}</p>
            </div>
            {(g.status === "active" || g.status === "paused") && (
              <button type="button" className="tag" onClick={() => void advanceGoal(g)}>
                {g.status === "active" ? "Pause" : "Resume"}
              </button>
            )}
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <label className="sr-only" htmlFor="goal-title">New goal</label>
          <input id="goal-title" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="e.g. Frontend intern, summer" className="qa-control" style={{ flex: 2, minWidth: 160 }} />
          <label className="sr-only" htmlFor="goal-role">Target role</label>
          <input id="goal-role" value={goalRole} onChange={(e) => setGoalRole(e.target.value)} placeholder="Target role" className="qa-control" style={{ flex: 1, minWidth: 120 }} />
          <button type="button" onClick={() => void createGoal()} disabled={!goalTitle.trim()} className="button primary sm">Add goal</button>
        </div>
      </section>

      {/* Resume Gap Analyzer Panel */}
      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel-head">
          <h2>Resume review & skill gap analysis</h2>
          <span className="tag">Career Scout</span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          <Dropdown
            label="Choose resume file"
            value={resumeId}
            onChange={setResumeId}
            options={[
              { value: "", label: "Pick an uploaded resume file…" },
              ...files.map((f) => ({ value: f.id, label: f.name })),
            ]}
          />

          <Dropdown
            label="Target role"
            value={targetRole}
            onChange={setTargetRole}
            options={ROLES.map((r) => ({ value: r.value, label: r.label }))}
          />

          <button onClick={analyze} className="button primary sm">
            Analyze resume
          </button>
        </div>

        {analysis && (
          <div style={{ marginTop: 16, padding: 18, background: "var(--color-paper)", borderRadius: 16, border: "1px solid var(--color-line)" }}>
            {/* ATS Score Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, paddingBottom: 14, borderBottom: "1px solid var(--color-line)" }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-muted)" }}>ATS Match Evaluation</span>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: "2px 0 0" }}>
                  {analysis.atsScore ?? 75}% — {analysis.matchTier ?? "Target Role Match"}
                </h3>
              </div>
              <span className="tag" style={{ background: (analysis.atsScore ?? 75) >= 80 ? "#e4f0df" : "#fef3c7", color: (analysis.atsScore ?? 75) >= 80 ? "#2d6325" : "#92400e", fontWeight: 700 }}>
                Role: {ROLES.find((r) => r.value === targetRole)?.label}
              </span>
            </div>

            {/* Skill Breakdown Badges */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, margin: "14px 0" }}>
              <div>
                <b style={{ fontSize: 12, color: "#2d6325", display: "block", marginBottom: 6 }}>✓ Matched Strengths ({analysis.strengths?.length ?? 0}):</b>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {analysis.strengths && analysis.strengths.length > 0 ? (
                    analysis.strengths.map((s, i) => (
                      <span key={i} style={{ fontSize: 11, padding: "2px 8px", background: "#e4f0df", color: "#2d6325", borderRadius: 6, fontWeight: 600 }}>
                        {s}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: 11, color: "var(--color-muted)" }}>No direct skill keywords detected.</span>
                  )}
                </div>
              </div>

              <div>
                <b style={{ fontSize: 12, color: "#c95938", display: "block", marginBottom: 6 }}>⚠ Skill Gaps to Address ({analysis.missing?.length ?? 0}):</b>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {analysis.missing && analysis.missing.length > 0 ? (
                    analysis.missing.map((m, i) => (
                      <span key={i} style={{ fontSize: 11, padding: "2px 8px", background: "#ffe0d6", color: "#c95938", borderRadius: 6, fontWeight: 600 }}>
                        + {m}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: 11, color: "#2d6325" }}>All core keywords covered!</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Plan */}
            {analysis.plan && analysis.plan.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-line)" }}>
                <b style={{ fontSize: 12, display: "block", marginBottom: 6 }}>Actionable Keyword Plan:</b>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.6 }}>
                  {analysis.plan.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Interview Prep Questions */}
            {analysis.interviewQuestions && analysis.interviewQuestions.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-line)" }}>
                <b style={{ fontSize: 12, color: "#0ea5c6", display: "block", marginBottom: 6 }}>Suggested Interview Prep Questions:</b>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "var(--color-ink)", lineHeight: 1.6 }}>
                  {analysis.interviewQuestions.map((q, idx) => (
                    <li key={idx} style={{ fontStyle: "italic" }}>&ldquo;{q}&rdquo;</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.note && <p style={{ fontSize: 11, color: "var(--color-muted)", margin: "10px 0 0" }}>{analysis.note}</p>}
          </div>
        )}
      </section>

      {/* Kanban Board Application Tracker Section */}
      <section className="panel" style={{ marginTop: 18, paddingBottom: 20 }}>
        <div className="panel-head" style={{ alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2>Application Kanban Tracker</h2>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--color-muted)" }}>
              Drag and drop cards across hiring stages from wishlist to signed offer.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="tag" style={{ fontSize: 11 }}>
              {apps.length} total applications
            </span>
            <div className="notion-view-switch" role="tablist" aria-label="Tracker layout">
              <button
                type="button"
                role="tab"
                aria-selected={trackerMode === "kanban"}
                onClick={() => setTrackerMode("kanban")}
                className={`notion-view-tab ${trackerMode === "kanban" ? "active" : ""}`}
              >
                Kanban
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={trackerMode === "list"}
                onClick={() => setTrackerMode("list")}
                className={`notion-view-tab ${trackerMode === "list" ? "active" : ""}`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Quick Add Application Bar */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14, marginBottom: 8, alignItems: "center" }}>
          <label htmlFor="app-company" className="sr-only">Company</label>
          <input
            id="app-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company (e.g. Stripe, Linear)"
            aria-label="Company"
            className="qa-control"
            style={{ flex: "1 1 150px" }}
          />
          <label htmlFor="app-role" className="sr-only">Role</label>
          <input
            id="app-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Role (e.g. Software Engineer Intern)"
            aria-label="Role"
            className="qa-control"
            style={{ flex: "1 1 180px" }}
          />
          <label htmlFor="app-url" className="sr-only">Job posting URL</label>
          <input
            id="app-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Job posting URL (optional)"
            aria-label="Job posting URL"
            className="qa-control"
            style={{ flex: "1 1 180px" }}
          />
          <Dropdown
            label="Starting stage"
            value={initialStatus}
            onChange={setInitialStatus}
            options={STAGES.map((s) => ({ value: s.id as string, label: s.title as string, dot: s.dot as string }))}
          />
          <button onClick={() => create()} className="button primary sm">
            + Add application
          </button>
        </div>

        {/* View Mode 1: KANBAN BOARD */}
        {trackerMode === "kanban" ? (
          <div className="kanban-board-container">
            {STAGES.map((stage) => {
              const columnApps = appsByStage[stage.id] || [];
              const isOver = dragOverColumn === stage.id;

              return (
                <div
                  key={stage.id}
                  className={`kanban-column ${isOver ? "drag-over" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverColumn(stage.id);
                  }}
                  onDragLeave={() => {
                    if (dragOverColumn === stage.id) setDragOverColumn(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverColumn(null);
                    if (draggedAppId) {
                      move(draggedAppId, stage.id);
                      setDraggedAppId(null);
                    }
                  }}
                >
                  {/* Column Header */}
                  <div className="kanban-col-head">
                    <div className="kanban-col-title-group">
                      <span className="kanban-col-indicator" style={{ background: stage.dot }} />
                      <h3 className="kanban-col-title">{stage.title}</h3>
                    </div>
                    <span className="kanban-col-badge">{columnApps.length}</span>
                  </div>

                  {/* Cards Scroll Area */}
                  <div className="kanban-cards-scroll">
                    {columnApps.map((a) => {
                      const stageIdx = STATUSES.indexOf(a.status as any);
                      const hasPrev = stageIdx > 0;
                      const hasNext = stageIdx < STATUSES.length - 1;

                      return (
                        <div
                          key={a.id}
                          className="kanban-card-item"
                          draggable={true}
                          onDragStart={() => setDraggedAppId(a.id)}
                          onDragEnd={() => setDraggedAppId(null)}
                        >
                          <div className="kanban-card-company">
                            <span>{a.company}</span>
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              {a.url && (
                                <a
                                  href={a.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Open job listing"
                                  style={{ color: "var(--color-brand)", textDecoration: "none" }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  ↗
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => setDeletingApp(a)}
                                title="Delete application"
                                className="link-danger"
                                aria-label={`Delete application for ${a.role}`}
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          <h4 className="kanban-card-role">{a.role}</h4>

                          {a.notes && (
                            <div
                              onClick={() => {
                                setEditingNotesApp(a);
                                setNotesText(a.notes || "");
                              }}
                              style={{
                                fontSize: 11.5,
                                color: "var(--color-muted)",
                                background: "var(--color-paper)",
                                padding: "6px 8px",
                                borderRadius: 8,
                                border: "1px solid var(--color-line)",
                                marginBottom: 6,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              title="Click to view full notes"
                            >
                              {a.notes}
                            </div>
                          )}

                          <div className="kanban-card-actions">
                            <button
                              type="button"
                              onClick={() => nudgeStage(a, "prev")}
                              disabled={!hasPrev}
                              className="kanban-move-btn"
                              title="Move back a stage"
                            >
                              ‹
                            </button>

                            <div style={{ display: "flex", gap: 4 }}>
                              <button
                                type="button"
                                onClick={() => coverLetter(a)}
                                className="tag"
                                title="Draft cover letter with AI"
                              >
                                Letter
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingNotesApp(a);
                                  setNotesText(a.notes || "");
                                }}
                                className="tag"
                                title="Add interview notes & contacts"
                              >
                                Notes
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => nudgeStage(a, "next")}
                              disabled={!hasNext}
                              className="kanban-move-btn"
                              title="Advance to next stage"
                            >
                              ›
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {columnApps.length === 0 && (
                      <div className="kanban-empty-drop">
                        No applications in this stage. Drag cards here.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* View Mode 2: LIST VIEW */
          <div className="space-y-3" style={{ marginTop: 14 }}>
            {apps.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--color-muted)", padding: 12 }}>
                No applications saved yet. Track your internship and job pipeline here.
              </p>
            ) : (
              apps.map((a) => (
                <div key={a.id} className="list-row" style={{ alignItems: "center" }}>
                  <div className="agent-icon green" style={{ margin: 0 }}>↗</div>
                  <div className="grow">
                    <b>{a.role} · {a.company}</b>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
                      <span className="tag" style={{ fontSize: 10, padding: "2px 6px" }}>
                        {a.status.toUpperCase()}
                      </span>
                      {a.url && (
                        <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "var(--color-brand)" }}>
                          View listing ↗
                        </a>
                      )}
                    </div>
                  </div>

                  <Dropdown
                    label="Application status"
                    value={a.status}
                    onChange={(v) => move(a.id, v)}
                    options={STAGES.map((s) => ({ value: s.id as string, label: s.title as string, dot: s.dot as string }))}
                  />

                  <button
                    onClick={() => {
                      setEditingNotesApp(a);
                      setNotesText(a.notes || "");
                    }}
                    className="tag"
                  >
                    {a.notes ? "View notes" : "Add note"}
                  </button>

                  <button onClick={() => coverLetter(a)} className="tag">
                    Draft letter
                  </button>

                  <button
                    onClick={() => setDeletingApp(a)}
                    aria-label={`Delete application for ${a.role}`}
                    className="link-danger"
                    title="Delete application"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* AI Generated Cover Letter Drawer */}
      {draft && (
        <section className="panel" style={{ marginTop: 18 }}>
          <div className="panel-head">
            <h2>Generated cover letter for {draftingApp?.role} at {draftingApp?.company}</h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="tag">DRAFT — Career Scout</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(draft);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="tag"
              >
                {copied ? "Copied to clipboard!" : "Copy text"}
              </button>
            </div>
          </div>
          <p style={{ fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.65, background: "var(--color-paper)", padding: 18, borderRadius: 14, border: "1px solid var(--color-line)" }}>
            {draft}
          </p>
        </section>
      )}

      {/* Edit Notes Modal Dialog */}
      <Dialog
        isOpen={Boolean(editingNotesApp)}
        onClose={() => setEditingNotesApp(null)}
        title={`Notes: ${editingNotesApp?.role} at ${editingNotesApp?.company}`}
        description="Record interview contacts, recruiter details, key discussion topics, and next steps."
        maxWidth={480}
      >
        <div>
          <textarea
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            placeholder="e.g. Recruiter call on Tuesday with Sarah. Need to review system design fundamentals and prepare questions about their API team…"
            rows={5}
            className="dialog-input"
            autoFocus
          />

          <div className="dialog-actions">
            <button
              type="button"
              onClick={() => setEditingNotesApp(null)}
              className="dialog-btn-cancel"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveNotes}
              className="dialog-btn-confirm brand"
            >
              Save notes
            </button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deletingApp)}
        onClose={() => setDeletingApp(null)}
        onConfirm={handleConfirmDelete}
        title="Delete application"
        message={`Are you sure you want to delete the application for ${deletingApp?.role ?? "this role"} at ${deletingApp?.company ?? "this company"}? This record will be permanently removed.`}
        confirmText="Delete application"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
