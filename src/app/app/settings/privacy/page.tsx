"use client";
import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ConfirmDialog } from "@/components/Dialog";

export default function PrivacySettings() {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function exportData() {
    setExporting(true);
    try {
      const [profile, projects, tasks, files, applications, approvals] = await Promise.all([
        fetch("/api/profile").then((r) => r.json()),
        fetch("/api/projects").then((r) => r.json()),
        fetch("/api/tasks").then((r) => r.json()),
        fetch("/api/files").then((r) => r.json()),
        fetch("/api/applications").then((r) => r.json()),
        fetch("/api/approvals").then((r) => r.json()),
      ]);

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        user: profile.user,
        projects: projects.projects,
        tasks: tasks.tasks,
        files: files.files,
        applications: applications.applications,
        approvals: approvals.approvals,
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `agenthub-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      if (res.ok) {
        await signOut({ callbackUrl: "/" });
      } else {
        setDeleteError("Failed to delete account. Please try again.");
      }
    } finally {
      setDeleting(false);
      setShowConfirmModal(false);
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", paddingBottom: 40 }}>
      {/* Settings Breadcrumb */}
      <div style={{ marginBottom: 18 }}>
        <Link
          href="/app/settings"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12.5,
            fontWeight: 700,
            color: "var(--color-muted)",
            textDecoration: "none",
            padding: "5px 12px",
            background: "var(--color-paper)",
            border: "1px solid var(--color-line)",
            borderRadius: 8,
            transition: "all 0.12s ease",
          }}
        >
          <span>‹</span> Settings
        </Link>
      </div>

      {/* Page Header with AgentHub Icon System */}
      <div className="page-head" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="agent-icon green" style={{ width: 44, height: 44, fontSize: 20 }}>
            ⚿
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24 }}>Privacy, Security & Data</h1>
            <p style={{ margin: "4px 0 0" }}>You own your notes and data. Export or erase your information anytime.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Export Data Panel */}
        <section className="panel" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div className="agent-icon blue" style={{ width: 38, height: 38, fontSize: 17 }}>
              ⎘
            </div>
            <div>
              <h2 style={{ fontSize: 16, margin: 0 }}>Export Workspace Data</h2>
              <span style={{ fontSize: 12, color: "var(--color-muted)" }}>Portable JSON Archive</span>
            </div>
          </div>

          <p style={{ fontSize: 13, color: "var(--color-muted)", lineHeight: 1.6, margin: "0 0 14px" }}>
            Download a complete JSON archive containing your academic profile, active project milestones, tasks, notes metadata, job applications, and safety approval logs.
          </p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
            <span className="tag" style={{ fontSize: 11 }}>◈ Profile & Courses</span>
            <span className="tag" style={{ fontSize: 11 }}>◈ Milestones & Tasks</span>
            <span className="tag" style={{ fontSize: 11 }}>◈ File Metadata</span>
            <span className="tag" style={{ fontSize: 11 }}>◈ Safety Logs</span>
          </div>

          <button
            onClick={exportData}
            disabled={exporting}
            className="button"
            style={{ fontSize: 13, height: 42, display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <span>{exporting ? "⏳" : "↓"}</span>
            {exporting ? "Compiling export…" : "Download all data (JSON)"}
          </button>
        </section>

        {/* Danger Zone Panel */}
        <section className="panel" style={{ padding: 20, borderColor: "#f1c2be", background: "#fffdfd" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div className="dialog-icon danger" style={{ width: 38, height: 38, fontSize: 16, margin: 0 }}>
              ⚿
            </div>
            <div>
              <h2 style={{ fontSize: 16, color: "#c0392b", margin: 0 }}>Danger Zone</h2>
              <span style={{ fontSize: 12, color: "#c0392b", fontWeight: 600 }}>Permanent & Irreversible</span>
            </div>
          </div>

          <p style={{ fontSize: 13, color: "var(--color-muted)", lineHeight: 1.6, margin: "0 0 16px" }}>
            Permanently delete your account and wipe all stored files, milestones, messages, and configurations. Active sessions will be terminated immediately.
          </p>

          {deleteError && (
            <div style={{ padding: "8px 12px", background: "#fee2e2", borderRadius: 8, color: "#dc2626", fontSize: 12.5, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <span>⚠️</span> {deleteError}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={deleting}
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              border: "1px solid #e08c84",
              background: "#fff5f5",
              color: "#c0392b",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.15s ease",
            }}
          >
            <span>⚿</span> Delete account and all data
          </button>
        </section>
      </div>

      <ConfirmDialog
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={deleteAccount}
        title="Permanently Delete Account?"
        description="Are you completely sure? This will immediately wipe your account, projects, uploaded notes, milestones, and conversation memory. This action cannot be undone."
        confirmText="Yes, Delete My Account"
        cancelText="Keep Account"
        variant="danger"
        icon="⚿"
        loading={deleting}
      />
    </main>
  );
}
