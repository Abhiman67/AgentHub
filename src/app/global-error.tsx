"use client";
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html><body><main style={{ fontFamily: "system-ui", maxWidth: 560, margin: "80px auto", padding: 24, textAlign: "center" }}><h1>AgentHub is temporarily unavailable</h1><p>Please retry the page. If the problem continues, contact support.</p><button onClick={() => reset()}>Retry</button></main></body></html>;
}
