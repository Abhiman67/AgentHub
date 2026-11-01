"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ApprovalCard } from "@/components/ApprovalCard";
import { RunPanel } from "@/components/RunPanel";
import { ChatMessage } from "@/components/ChatMessage";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ConfirmDialog, PromptDialog, Dialog } from "@/components/Dialog";
import Dropdown from "@/components/Dropdown";
import { SUGGESTED_PROMPTS } from "@/lib/agents";

type Msg = { role: string; content: string };
type Conv = { id: string; title: string; projectId: string | null };
type Notice = { kind: "citation" | "approval"; label: string; approvalId?: string; description?: string; sourceId?: string };


const META: Record<string, [string, string, string]> = {
  "study-coach": ["◒", "yellow", "Academic Support"],
  "project-guide": ["⌘", "blue", "Technical Partner"],
  "career-scout": ["↗", "green", "Career Advisor"],
  "writing-buddy": ["✎", "lav", "Writing Mentor"],
  "code-mentor": ["◉", "peach", "Code Mentor"],
  "interview-coach": ["☼", "peri", "Interview Coach"],
};

const DEFAULT_PROMPTS = [
  "Give me a hint on my coursework",
  "Show a detailed code or study example",
  "Create revision flashcards from my notes",
];

const PROMPT_DETAILS: Record<string, { desc: string }> = {
  "Give me a hint": { desc: "Get guided hints without direct spoilers" },
  "Show an example": { desc: "Step-by-step breakdown with illustrative patterns" },
  "Create a flashcard": { desc: "Turn current topic into active recall flashcards" },
  "Break down milestones": { desc: "Organize project goals into manageable sprints" },
  "Review my resume": { desc: "Tailor achievements and bullet points for internships" },
};

export default function ChatPage() {
  const { agentId } = useParams() as { agentId: string };
  const searchParams = useSearchParams();
  const [agent, setAgent] = useState<{ id: string; name: string; role: string; template: string } | null>(null);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [convId, setConvId] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem(`conv:${agentId}`) ?? "" : ""
  );
  const [messages, setMessages] = useState<Msg[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [files, setFiles] = useState<{ id: string; name: string }[]>([]);
  const [projectId, setProjectId] = useState("");
  const [input, setInput] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<Notice | null>(null);

  const bottom = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const reloadProjects = useCallback(async () => {
    const res = await fetch("/api/projects");
    if (res.ok) {
      const d = await res.json();
      setProjects(d.projects ?? []);
    }
  }, []);

  useEffect(() => {
    fetch("/api/agents").then((r) => r.json()).then((d) => {
      setAgent((d.agents ?? []).find((a: { id: string }) => a.id === agentId) ?? null);
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reloadProjects();
    fetch("/api/files").then((r) => r.json()).then((d) => setFiles((d.files ?? []).slice(0, 5)));
  }, [agentId, reloadProjects]);

  const loadList = useCallback(async () => {
    const res = await fetch(`/api/agents/${agentId}/conversations`);
    if (res.ok) {
      const d = await res.json();
      setConvs(d.conversations ?? []);
    }
  }, [agentId]);

  const loadConv = useCallback(async (id: string) => {
    const res = await fetch(`/api/conversations/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages((data.conversation.messages ?? []).map((m: Msg) => ({ role: m.role, content: m.content })));
    setProjectId(data.conversation.projectId ?? "");
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadList(); }, [loadList]);

  async function attachProject(nextProj: string) {
    if (nextProj === "__new__") {
      setShowNewProjectModal(true);
      return;
    }
    setProjectId(nextProj);
    if (convId) {
      await fetch(`/api/conversations/${convId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: nextProj || null }),
      });
    }
  }

  async function createProject(name: string) {
    setCreatingProject(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) return;
      const d = await res.json();
      await reloadProjects();
      setShowNewProjectModal(false);
      if (d.project?.id) await attachProject(d.project.id);
    } finally {
      setCreatingProject(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (convId) loadConv(convId);
  }, [convId, loadConv]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  // Prefill the composer from dashboard handoffs (?q=). Consumed once.
  useEffect(() => {
    const q = searchParams.get("q");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q) setInput(q.slice(0, 2000));
  }, [searchParams]);

  const [icon, color, support] = agent ? META[agent.template] ?? ["✦", "yellow", "Online"] : ["✦", "yellow", "Online"];

  // Synchronize active conversation with URL ?c= parameter, falling back to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlConv = new URLSearchParams(window.location.search).get("c");
      if (urlConv) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setConvId(urlConv);
        return;
      }
    }
    const saved = localStorage.getItem(`conv:${agentId}`);
    if (saved) {
      setConvId(saved);
    }
  }, [agentId]);

  async function select(id: string) {
    setConvId(id);
    localStorage.setItem(`conv:${agentId}`, id);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("c", id);
      window.history.replaceState(null, "", url.toString());
    }
    setNotices([]);
  }

  async function handleFeedback(vote: "up" | "down") {
    try {
      await fetch("/api/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: `message_feedback_${vote}` }),
      });
    } catch {}
  }

  async function start(): Promise<string> {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, projectId: projectId || undefined }),
    });
    if (!res.ok) throw new Error("Could not start conversation");
    const data = await res.json();
    const id = data.conversation.id as string;
    setConvId(id);
    localStorage.setItem(`conv:${agentId}`, id);
    loadList();
    return id;
  }

  async function send(prompt?: string) {
    const text = (prompt ?? (input || lastPrompt)).trim();
    if (!text || busy) return;
    setLastPrompt(text);
    setBusy(true);
    setError("");
    setNotices([]);
    let id = convId;
    try {
      if (!id) id = await start();
    } catch {
      setError("Could not start conversation. Retry.");
      setBusy(false);
      return;
    }
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setMessages((m) => [...m, { role: "user", content: text }]);
    abort.current = new AbortController();
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: abort.current.signal,
      });
      if (!res.ok || !res.body) throw new Error("Request failed");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const p of parts) {
          const line = p.trim().replace(/^data: /, "");
          try {
            const e = JSON.parse(line);
            if (e.type === "message_delta") {
              acc += e.text;
              const snapshot = acc;
              setMessages((m) => [...m.slice(0, -1), { role: "assistant", content: snapshot }]);
            } else if (e.type === "citation") {
              setNotices((n) => [...n, { kind: "citation", label: e.label, sourceId: e.sourceId }]);
            } else if (e.type === "approval_required") {
              setNotices((n) => [...n, { kind: "approval", label: "Approval needed", approvalId: e.approvalId, description: e.description }]);
            } else if (e.type === "error") {
              throw new Error(e.message);
            }
          } catch {}
        }
      }
      loadList();
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError("Response failed. Your data is safe — retry.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function confirmRename(title: string) {
    if (!convId || !title.trim()) return;
    setSavingTitle(true);
    try {
      await fetch(`/api/conversations/${convId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      setShowRenameModal(false);
      loadList();
    } finally {
      setSavingTitle(false);
    }
  }

  async function newChat() {
    abort.current?.abort();
    const id = await start();
    setMessages([]);
    setNotices([]);
    setConvId(id);
  }

  async function confirmDeleteChat() {
    if (!convId) return;
    setDeleting(true);
    try {
      await fetch(`/api/conversations/${convId}`, { method: "DELETE" });
      localStorage.removeItem(`conv:${agentId}`);
      setConvId("");
      setMessages([]);
      setShowDeleteModal(false);
      loadList();
    } finally {
      setDeleting(false);
    }
  }

  const activeProject = projects.find((p) => p.id === projectId);
  const activeConv = convs.find((c) => c.id === convId);
  const suggested = (agent && SUGGESTED_PROMPTS[agent.template]) ?? DEFAULT_PROMPTS;

  return (
    <div className={`claude-chat-layout ${showContext ? "with-context" : ""}`}>
      {/* Left Sidebar: Claude-style History & New Chat */}
      <aside className="claude-sidebar">
        <button type="button" onClick={newChat} className="claude-new-chat-btn">
          <span>+ New chat</span>
          <span className="claude-shortcut-badge">⌘N</span>
        </button>

        <div className="label" style={{ margin: "0 6px 8px" }}>Recent Chats</div>
        <nav className="claude-nav-list">
          {convs.slice(0, 20).map((c) => (
            <a
              key={c.id}
              onClick={() => select(c.id)}
              className={`claude-nav-item ${c.id === convId ? "active" : ""}`}
              title={c.title}
            >
              <span className="claude-nav-title">{c.title}</span>
            </a>
          ))}
          {convs.length === 0 && (
            <div style={{ padding: "12px 8px", fontSize: 12, color: "var(--color-muted)" }}>
              No chats yet
            </div>
          )}
        </nav>

        {convId && (
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexShrink: 0 }}>
            <button
              onClick={() => setShowRenameModal(true)}
              className="tag"
            >
              Rename
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="tag danger"
            >
              Delete
            </button>
          </div>
        )}

        <Link
          href="/app/agents"
          className="button light sm"
          style={{ width: "100%", marginTop: 14 }}
        >
          ← All agents
        </Link>
      </aside>

      {/* Central Canvas: Claude-style Editorial Workspace */}
      <section className="claude-canvas">
        {/* Claude Header */}
        <header className="claude-header">
          <div className="claude-header-left">
            <div className={`agent-icon ${color} claude-icon-pill`}>
              {icon}
            </div>
            <div>
              <h1 className="claude-agent-title">
                {agent?.name ?? "Agent"}
                <span className="claude-role-tag">· {support}</span>
              </h1>
            </div>
          </div>

          <div className="claude-header-right">
            {activeProject && (
              <span className="claude-pill-badge" style={{ fontSize: 11 }}>
                <span>▣</span> {activeProject.name}
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowContext(!showContext)}
              className={`claude-toggle-btn ${showContext ? "active" : ""}`}
              title="Toggle Project Context & Notes"
            >
              {showContext ? "Hide Context" : "Project Context"}
            </button>
          </div>
        </header>

        {/* Notices & Approvals */}
        {notices
          .filter((n) => n.kind === "approval")
          .map((n) => (
            <div key={n.approvalId} style={{ maxWidth: 760, margin: "14px auto 0", padding: "0 24px", width: "100%" }}>
              <ApprovalCard
                id={n.approvalId!}
                title="Action Approval Needed"
                description={n.description ?? ""}
              />
            </div>
          ))}

        {/* Messages Stream Container */}
        <div className="claude-messages-container" role="log" aria-live="polite">
          <div className="claude-stream-inner">
            {/* Claude-style Welcome State when conversation is empty */}
            {messages.length === 0 && (
              <div className="claude-welcome-state">
                <div className={`agent-icon ${color} claude-welcome-icon`}>
                  {icon}
                </div>
                <h2 className="claude-welcome-h1">
                  How can {agent?.name ?? "your agent"} help today?
                </h2>
                <p className="claude-welcome-p">
                  Ask conceptual questions, review coursework, inspect attached project milestones, or start with a suggested topic:
                </p>

                <div className="claude-prompt-grid">
                  {suggested.map((p) => {
                    const detail = PROMPT_DETAILS[p]?.desc || "Click to begin exploring with your agent";
                    return (
                      <div
                        key={p}
                        onClick={() => send(p)}
                        className="claude-prompt-card"
                      >
                        <b>{p} →</b>
                        <span>{detail}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Render Claude Messages */}
            {messages.map((m, i) => (
              <ChatMessage
                key={i}
                role={m.role as "user" | "assistant"}
                content={m.content}
                agentName={agent?.name}
                agentIcon={icon}
                agentColor={color}
                onRetry={m.role === "assistant" && i === messages.length - 1 ? () => send(lastPrompt) : undefined}
                onFeedback={m.role === "assistant" ? (vote) => handleFeedback(vote) : undefined}
              />
            ))}

            {/* Streaming Typing Indicator */}
            {busy && (!messages.length || messages[messages.length - 1].role === "user") && (
              <div className="claude-assistant-row">
                <div className="claude-assistant-header">
                  <div className={`agent-icon ${color} claude-icon-pill`}>
                    {icon}
                  </div>
                  <span className="claude-assistant-name">{agent?.name}</span>
                </div>
                <TypingIndicator agentName={agent?.name} />
              </div>
            )}

            {/* Citations & Error alerts */}
            {notices.filter((n) => n.kind === "citation").length > 0 && (
              <div style={{ fontSize: 11.5, color: "var(--color-muted)", padding: "8px 0" }} role="note">
                <b>Sources cited:</b>{" "}
                <span className="inline-flex flex-wrap gap-1.5 ml-1">
                  {notices
                    .filter((n) => n.kind === "citation")
                    .map((n, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedCitation(n)}
                        className="tag"
                        title="Click to inspect cited source"
                      >
                        {n.label}
                      </button>
                    ))}
                </span>
              </div>
            )}

            {error && (
              <div style={{ fontSize: 12.5, color: "#c0392b", padding: "8px 0" }} role="alert">
                {error}{" "}
                <button
                  onClick={() => send(lastPrompt)}
                  className="tag"
                >
                  Retry
                </button>
              </div>
            )}

            <div ref={bottom} />
          </div>
        </div>

        {/* Claude Floating Composer */}
        <div className="claude-composer-wrapper">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="claude-composer-box"
          >
            <label htmlFor="claude-input" className="sr-only">
              Ask {agent?.name}
            </label>
            <textarea
              id="claude-input"
              ref={textareaRef}
              value={input}
              rows={1}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={`Reply to ${agent?.name ?? "agent"}...`}
              className="claude-textarea"
              disabled={busy}
            />

            <div className="claude-composer-toolbar">
              <div className="claude-toolbar-left">
                <span className="claude-pill-badge">
                  <span>{icon}</span> {agent?.name}
                </span>

                <Dropdown
                  value={projectId}
                  options={[
                    { value: "", label: "No project" },
                    ...projects.map((p) => ({ value: p.id, label: p.name })),
                    { value: "__new__", label: "+ New project…" },
                  ]}
                  onChange={(nextProj) => void attachProject(nextProj)}
                  label="Project"
                />
              </div>

              <div className="claude-toolbar-right">
                <span className="claude-shortcut-hint">
                  {busy ? "Claude is thinking..." : "Shift + Return for newline"}
                </span>

                {busy ? (
                  <button
                    type="button"
                    onClick={() => abort.current?.abort()}
                    className="button secondary sm"
                    title="Stop generating response"
                    aria-label="Stop generation"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="button primary sm"
                    title="Send message"
                    aria-label="Send message"
                  >
                    Send
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Right Drawer: Claude Artifacts / Context Pane */}
      {showContext && (
        <aside className="claude-context-drawer">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 14, margin: 0, fontWeight: 800 }}>Project Context</h2>
            <button
              type="button"
              onClick={() => setShowContext(false)}
              className="tag"
              aria-label="Close context panel"
            >
              Close
            </button>
          </div>

          <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--color-muted)" }}>
            Grounds this agent&apos;s responses in your active semester goals and lecture notes.
          </p>

          <label htmlFor="drawer-project" className="sr-only">
            Active project
          </label>
          <Dropdown
            value={projectId}
            options={[
              { value: "", label: "No project attached" },
              ...projects.map((p) => ({ value: p.id, label: p.name })),
              { value: "__new__", label: "+ New project…" },
            ]}
            onChange={(nextProj) => void attachProject(nextProj)}
            label="Active project"
          />

          <h3>Attached Files & Notes</h3>
          {files.length === 0 ? (
            <p style={{ fontSize: 12 }}>No notes uploaded yet.</p>
          ) : (
            <ul style={{ paddingLeft: 16, margin: "0 0 16px" }}>
              {files.map((f) => (
                <li key={f.id} style={{ fontSize: 11.5, marginBottom: 5 }}>
                  {f.name}
                </li>
              ))}
            </ul>
          )}

          <h3>Suggested Agent Actions</h3>
          <p style={{ fontSize: 12, lineHeight: 1.6 }}>
            • Summarize recent lecture slides<br />
            • Generate custom study flashcards<br />
            • Create milestone checklist
          </p>

          <div style={{ marginTop: 12 }}>
            <RunPanel agentId={agentId} conversationId={convId} projectId={projectId} />
          </div>
        </aside>
      )}

      {/* Delete Chat Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteChat}
        title="Delete this conversation?"
        description="Are you sure you want to delete this chat session? All message history, notes references, and citations will be permanently removed."
        confirmText="Delete Chat"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />

      {/* New Project Prompt Dialog */}
      <PromptDialog
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onSubmit={(name) => void createProject(name)}
        title="New project"
        description="Name it and keep chatting — it attaches to this conversation automatically."
        placeholder="e.g., Semester 6 Major Project"
        submitText="Create project"
        cancelText="Cancel"
        loading={creatingProject}
      />

      {/* Rename Chat Prompt Dialog */}
      <PromptDialog
        isOpen={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        onSubmit={confirmRename}
        title="Rename Conversation"
        description="Enter a new descriptive title for this conversation session."
        defaultValue={activeConv?.title ?? ""}
        placeholder="e.g., Biology Exam Revision"
        submitText="Update Title"
        cancelText="Cancel"
        loading={savingTitle}
      />

      {/* Citation Source Inspection Dialog */}
      {selectedCitation && (
        <Dialog
          isOpen={!!selectedCitation}
          onClose={() => setSelectedCitation(null)}
          title="Cited Document Source"
          description="This reference material was used by the agent to substantiate its response."
        >
          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="tag">{selectedCitation.label}</span>
            </div>
            {selectedCitation.sourceId && (
              <div style={{ marginTop: 8, fontSize: 11, color: "var(--color-muted)" }}>ID: {selectedCitation.sourceId}</div>
            )}
          </div>
          <p className="dialog-desc">
            Backoff matched excerpts from this file against your prompt using semantic chunk retrieval. You can inspect or manage all your course notes in the Files workspace.
          </p>
          <div className="dialog-actions">
              <Link
                href="/app/files"
                className="dialog-btn-confirm brand"
                style={{ textDecoration: "none" }}
              >
                Go to Files & Notes
              </Link>
              <button
                onClick={() => setSelectedCitation(null)}
                className="dialog-btn-cancel"
              >
                Close
              </button>
            </div>
        </Dialog>
      )}
    </div>
  );
}
