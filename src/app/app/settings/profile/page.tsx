"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfileSettings() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    institution: "",
    degree: "",
    semester: "",
    studyHours: 2,
    careerTarget: "",
  });
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => {
        if (r.status === 401) router.push("/login");
        return r.json();
      })
      .then((d) => {
        if (d.user) {
          setEmail(d.user.email ?? "");
          setForm({
            name: d.user.name ?? "",
            institution: d.user.profile?.institution ?? "",
            degree: d.user.profile?.degree ?? "",
            semester: d.user.profile?.semester ?? "",
            studyHours: d.user.profile?.studyHours ?? 2,
            careerTarget: d.user.profile?.careerTarget ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMsg("Profile saved successfully.");
      } else {
        setMsg("Failed to save profile. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="p-8">Loading profile…</main>;

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", paddingBottom: 40 }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/app/settings" className="text-sm underline">← Back to Settings</Link>
      </div>

      <div className="page-head" style={{ marginBottom: 20 }}>
        <div>
          <h1>Profile & Academic Info</h1>
          <p>This context is shared with Study Coach and Career Scout to personalize their guidance.</p>
        </div>
      </div>

      <form onSubmit={save} className="panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
            Account Email (Read-only)
          </label>
          <input
            value={email}
            disabled
            style={{
              width: "100%",
              height: 42,
              padding: "0 14px",
              borderRadius: 12,
              border: "1px solid var(--color-line)",
              background: "var(--color-paper)",
              color: "var(--color-muted)",
              fontSize: 13,
            }}
          />
        </div>

        <div>
          <label htmlFor="pf-name" style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
            Full Name
          </label>
          <input
            id="pf-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your full name"
            required
            style={{
              width: "100%",
              height: 42,
              padding: "0 14px",
              borderRadius: 12,
              border: "1px solid var(--color-line)",
              background: "var(--color-card)",
              fontSize: 13,
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label htmlFor="pf-inst" style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              College / University
            </label>
            <input
              id="pf-inst"
              value={form.institution}
              onChange={(e) => setForm({ ...form, institution: e.target.value })}
              placeholder="e.g. Stanford University"
              style={{
                width: "100%",
                height: 42,
                padding: "0 14px",
                borderRadius: 12,
                border: "1px solid var(--color-line)",
                background: "var(--color-card)",
                fontSize: 13,
              }}
            />
          </div>

          <div>
            <label htmlFor="pf-deg" style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              Degree & Major
            </label>
            <input
              id="pf-deg"
              value={form.degree}
              onChange={(e) => setForm({ ...form, degree: e.target.value })}
              placeholder="e.g. B.Tech Computer Science"
              style={{
                width: "100%",
                height: 42,
                padding: "0 14px",
                borderRadius: 12,
                border: "1px solid var(--color-line)",
                background: "var(--color-card)",
                fontSize: 13,
              }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label htmlFor="pf-sem" style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              Current Semester / Year
            </label>
            <input
              id="pf-sem"
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
              placeholder="e.g. Semester 6"
              style={{
                width: "100%",
                height: 42,
                padding: "0 14px",
                borderRadius: 12,
                border: "1px solid var(--color-line)",
                background: "var(--color-card)",
                fontSize: 13,
              }}
            />
          </div>

          <div>
            <label htmlFor="pf-hours" style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              Daily Study Goal (Hours)
            </label>
            <input
              id="pf-hours"
              type="number"
              min={0}
              max={24}
              value={form.studyHours}
              onChange={(e) => setForm({ ...form, studyHours: Number(e.target.value) })}
              style={{
                width: "100%",
                height: 42,
                padding: "0 14px",
                borderRadius: 12,
                border: "1px solid var(--color-line)",
                background: "var(--color-card)",
                fontSize: 13,
              }}
            />
          </div>
        </div>

        <div>
          <label htmlFor="pf-target" style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
            Career Target / Dream Role
          </label>
          <input
            id="pf-target"
            value={form.careerTarget}
            onChange={(e) => setForm({ ...form, careerTarget: e.target.value })}
            placeholder="e.g. Frontend Engineer at a high-growth startup"
            style={{
              width: "100%",
              height: 42,
              padding: "0 14px",
              borderRadius: 12,
              border: "1px solid var(--color-line)",
              background: "var(--color-card)",
              fontSize: 13,
            }}
          />
        </div>

        {msg && (
          <p style={{ fontSize: 13, fontWeight: 700, color: msg.includes("success") ? "#2d6325" : "#c0392b", margin: 0 }}>
            {msg}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="button"
          style={{ width: "100%", justifyContent: "center", height: 44, marginTop: 8 }}
        >
          {saving ? "Saving changes…" : "Save profile"}
        </button>
      </form>
    </main>
  );
}
