"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const GOALS = ["Improve grades", "Complete major project", "Find internship", "Prepare for placements", "Improve coding", "Improve communication"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ institution: "", degree: "", semester: "", goals: [] as string[], subjects: "", skills: "", careerTarget: "", studyHours: 2 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/profile").then((r) => {
      if (r.status === 401) router.push("/login");
    });
  }, [router]);

  function toggleGoal(g: string) {
    setForm((f) => ({ ...f, goals: f.goals.includes(g) ? f.goals.filter((x) => x !== g) : [...f.goals, g] }));
  }

  async function finish(skip = false) {
    setSaving(true);
    setError("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        institution: form.institution, degree: form.degree, semester: form.semester,
        goals: form.goals, subjects: form.subjects.split(",").map((s) => s.trim()).filter(Boolean),
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        careerTarget: form.careerTarget, studyHours: form.studyHours, onboardingDone: true,
      }),
    });
    if (!res.ok) { setError("We couldn’t save your setup. Try again."); setSaving(false); return; }
    await fetch("/api/agents/ensure", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goals: form.goals }) });
    router.push("/app");
  }

  return (
    <main className="onboarding-page mx-auto max-w-xl px-5 py-12">
      <p className="text-sm text-muted">Step {step} of 4 · Build your student context. You can skip and finish later.</p>
      <div className="mt-2 h-2 rounded-full bg-line"><div className="h-2 rounded-full bg-brand" style={{ width: `${step * 25}%` }} /></div>
      {step === 1 && (
        <div className="mt-6 space-y-3">
          <h1 className="text-2xl font-extrabold">Start with your semester</h1>
          <p className="text-sm text-muted">Backoff uses this to make course and workload suggestions feel specific to you.</p>
          {(["institution", "degree", "semester"] as const).map((k) => (
            <input key={k} aria-label={k} placeholder={k === "institution" ? "College or university" : k === "degree" ? "Degree or program" : "Semester or year (e.g. 6)"} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="h-11 w-full rounded-2xl border border-line bg-card px-4" />
          ))}
        </div>
      )}
      {step === 2 && (
        <div className="mt-6">
          <h1 className="text-2xl font-extrabold">What are you moving forward?</h1>
          <p className="text-sm text-muted">Pick any that matter this semester. You can change these later.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <button key={g} onClick={() => toggleGoal(g)} className={`rounded-full border px-4 py-2 text-sm font-bold ${form.goals.includes(g) ? "bg-ink text-white" : "bg-card"}`}>{g}</button>
            ))}
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="mt-6 space-y-3">
          <h1 className="text-2xl font-extrabold">Add useful context</h1>
          <input placeholder="Subjects (comma separated)" value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} className="h-11 w-full rounded-2xl border border-line bg-card px-4" />
          <input placeholder="Skills" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} className="h-11 w-full rounded-2xl border border-line bg-card px-4" />
          <input placeholder="Career target" value={form.careerTarget} onChange={(e) => setForm({ ...form, careerTarget: e.target.value })} className="h-11 w-full rounded-2xl border border-line bg-card px-4" />
        </div>
      )}
      {step === 4 && (
        <div className="mt-6">
          <h1 className="text-2xl font-extrabold">Your student workspace is ready</h1>
          <p className="text-sm text-muted">We&apos;ll start with Study Coach, Project Guide, and Career Scout. Connect Google Classroom from your home screen when you’re ready.</p>
          <div className="onboarding-preview"><b>{form.goals.length ? form.goals.join(" · ") : "A calmer way to move through your semester"}</b><span>{form.studyHours} hours/day · {form.subjects || "your subjects"}</span></div>
        </div>
      )}
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      <div className="mt-8 flex gap-2">
        {step > 1 && <button onClick={() => setStep(step - 1)} className="rounded-full border border-line px-5 py-2.5 font-bold">Back</button>}
        {step < 4 ? <button onClick={() => setStep(step + 1)} className="rounded-full bg-ink px-5 py-2.5 font-bold text-white">Next</button>
          : <button onClick={() => void finish()} disabled={saving} className="rounded-full bg-brand px-5 py-2.5 font-bold text-white">{saving ? "Saving…" : "Open my workspace"}</button>}
        <button onClick={() => void finish(true)} disabled={saving} className="text-sm underline">Skip for now</button>
      </div>
    </main>
  );
}
