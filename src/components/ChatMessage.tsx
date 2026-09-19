"use client";
import { useState } from "react";

type MessageProps = {
  role: "user" | "assistant";
  content: string;
  agentName?: string;
  agentIcon?: string;
  agentColor?: string;
  userTag?: string;
  onRetry?: () => void;
  onFeedback?: (vote: "up" | "down") => void;
};

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <div className="code-lang-group">
          <span className="code-dot" />
          <span className="code-lang">{language || "plaintext"}</span>
        </div>
        <button
          onClick={handleCopy}
          className="code-copy-btn"
          aria-label="Copy code to clipboard"
          type="button"
        >
          {copied ? "✓ Copied" : "Copy code"}
        </button>
      </div>
      <pre className="code-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderFormattedText(text: string) {
  // Split on code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const firstLineEnd = part.indexOf("\n");
      const lang = firstLineEnd !== -1 ? part.slice(3, firstLineEnd).trim() : "";
      const code = firstLineEnd !== -1 ? part.slice(firstLineEnd + 1, -3) : part.slice(3, -3);
      return <CodeBlock key={index} language={lang} code={code} />;
    }

    // Process line by line for markdown blocks
    const lines = part.split("\n");
    const elements: React.ReactNode[] = [];
    let currentList: { type: "ul" | "ol"; items: string[] } | null = null;

    function flushList() {
      if (!currentList) return;
      if (currentList.type === "ul") {
        elements.push(
          <ul key={`list-${elements.length}`} className="msg-list">
            {currentList.items.map((item, i) => (
              <li key={i}>{formatInline(item)}</li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`list-${elements.length}`} className="msg-list ordered">
            {currentList.items.map((item, i) => (
              <li key={i}>{formatInline(item)}</li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }

    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim();

      // Headers
      if (trimmed.startsWith("### ")) {
        flushList();
        elements.push(<h4 key={`h4-${lineIdx}`} className="msg-h4">{formatInline(trimmed.slice(4))}</h4>);
      } else if (trimmed.startsWith("## ")) {
        flushList();
        elements.push(<h3 key={`h3-${lineIdx}`} className="msg-h3">{formatInline(trimmed.slice(3))}</h3>);
      } else if (trimmed.startsWith("# ")) {
        flushList();
        elements.push(<h2 key={`h2-${lineIdx}`} className="msg-h2">{formatInline(trimmed.slice(2))}</h2>);
      }
      // Blockquote
      else if (trimmed.startsWith("> ")) {
        flushList();
        elements.push(<blockquote key={`quote-${lineIdx}`} className="msg-quote">{formatInline(trimmed.slice(2))}</blockquote>);
      }
      // Unordered list
      else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const itemText = trimmed.slice(2);
        if (currentList && currentList.type === "ul") {
          currentList.items.push(itemText);
        } else {
          flushList();
          currentList = { type: "ul", items: [itemText] };
        }
      }
      // Ordered list
      else if (/^\d+\.\s/.test(trimmed)) {
        const itemText = trimmed.replace(/^\d+\.\s/, "");
        if (currentList && currentList.type === "ol") {
          currentList.items.push(itemText);
        } else {
          flushList();
          currentList = { type: "ol", items: [itemText] };
        }
      }
      // Empty line
      else if (trimmed === "") {
        flushList();
      }
      // Normal paragraph line
      else {
        flushList();
        elements.push(
          <p key={`p-${lineIdx}`} className="msg-p">
            {formatInline(line)}
          </p>
        );
      }
    });

    flushList();
    return <div key={index}>{elements}</div>;
  });
}

function formatInline(str: string): React.ReactNode[] {
  const tokens = str.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return tokens.map((token, i) => {
    if (token.startsWith("`") && token.endsWith("`") && token.length > 2) {
      return <code key={i} className="msg-inline-code">{token.slice(1, -1)}</code>;
    }
    if (token.startsWith("**") && token.endsWith("**") && token.length > 4) {
      return <strong key={i}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
      return <em key={i}>{token.slice(1, -1)}</em>;
    }
    return token;
  });
}

export function ChatMessage({
  role,
  content,
  agentName = "Agent",
  agentIcon = "✦",
  agentColor = "yellow",
  onRetry,
  onFeedback,
}: MessageProps) {
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [voted, setVoted] = useState<"up" | "down" | null>(null);
  const isAgent = role === "assistant";

  function copyFullMessage() {
    navigator.clipboard.writeText(content);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  }

  function handleVote(vote: "up" | "down") {
    if (voted === vote) return;
    setVoted(vote);
    onFeedback?.(vote);
  }

  if (!isAgent) {
    // Claude-style user message: soft, warm bordered stone card aligned to the right
    return (
      <div className="claude-user-row">
        <div className="claude-user-card">
          <div className="claude-user-body">
            {content}
          </div>
          <button
            type="button"
            onClick={copyFullMessage}
            className="claude-user-copy"
            title="Copy message"
            aria-label="Copy message"
          >
            {copiedMsg ? "✓" : "⎘"}
          </button>
        </div>
      </div>
    );
  }

  // Claude-style assistant message: open, editorial canvas with clean typography and action bar
  return (
    <div className="claude-assistant-row">
      <div className="claude-assistant-header">
        <div className={`agent-icon ${agentColor} claude-icon-pill`}>
          {agentIcon}
        </div>
        <span className="claude-assistant-name">{agentName}</span>
      </div>

      <div className="claude-assistant-body">
        {content ? renderFormattedText(content) : <span className="streaming-cursor">…</span>}
      </div>

      {content && (
        <div className="claude-msg-actions">
          <button
            type="button"
            onClick={copyFullMessage}
            className="claude-action-btn"
            title="Copy full response"
          >
            {copiedMsg ? "✓ Copied" : "⎘ Copy"}
          </button>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="claude-action-btn"
              title="Regenerate response"
            >
              ↻ Retry
            </button>
          )}
          <button
            type="button"
            onClick={() => handleVote("up")}
            className={`claude-action-btn ${voted === "up" ? "text-emerald-600 font-bold" : ""}`}
            title="Helpful response"
            aria-label="Thumbs up"
          >
            👍{voted === "up" ? " Helpful" : ""}
          </button>
          <button
            type="button"
            onClick={() => handleVote("down")}
            className={`claude-action-btn ${voted === "down" ? "text-rose-600 font-bold" : ""}`}
            title="Not helpful"
            aria-label="Thumbs down"
          >
            👎{voted === "down" ? " Reported" : ""}
          </button>
        </div>
      )}
    </div>
  );
}
