"use client";

export function TypingIndicator({ agentName }: { agentName?: string }) {
  return (
    <div className="typing-indicator" aria-label={`${agentName ?? "Agent"} is typing`}>
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </div>
  );
}
