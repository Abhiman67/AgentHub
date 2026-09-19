"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewProject() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create project");
      router.push(`/app/projects/${data.project.id}`);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not create project"); setSaving(false); }
  }
  return <main className="mx-auto max-w-xl p-8">
    <Link href="/app/projects" className="text-sm underline">← Back to projects</Link>
    <h1 className="mt-6 text-3xl font-extrabold">Create project</h1>
    <form onSubmit={submit} className="panel mt-6 space-y-4">
      <label className="block text-sm font-semibold">Project name<input required maxLength={100} value={name} onChange={e => setName(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-line bg-card px-3" /></label>
      <label className="block text-sm font-semibold">Description<textarea maxLength={2000} value={description} onChange={e => setDescription(e.target.value)} className="mt-2 min-h-28 w-full rounded-xl border border-line bg-card p-3" /></label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={saving} className="button primary" type="submit">{saving ? "Creating…" : "Create project"}</button>
    </form>
  </main>;
}
