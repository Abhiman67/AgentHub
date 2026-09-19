"use client";
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main style={{ maxWidth: 560, margin: "80px auto", padding: 24, textAlign: "center" }}><h1>Something went wrong</h1><p style={{ color: "var(--color-muted)", margin: "12px 0 24px" }}>The workspace could not finish loading. Your data is safe.</p><button className="button primary" onClick={() => reset()}>Try again</button></main>;
}
