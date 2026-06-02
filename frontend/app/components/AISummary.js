"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, RefreshCw, Clock } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { generateSummary } from "../lib/api";

// Simple markdown renderer — handles **bold**, headers, bullet lists, *italic*
function renderMarkdown(text) {
  if (!text) return null;

  return text.split("\n").map((line, i) => {
    // Headers
    if (line.startsWith("## ")) {
      return (
        <h3 key={i} className="text-base font-semibold text-[rgb(var(--fg))] mt-6 mb-2 tracking-tight">
          {line.replace("## ", "")}
        </h3>
      );
    }

    // Horizontal rule
    if (line.trim() === "---") {
      return <hr key={i} className="border-[rgb(var(--border))] my-4" />;
    }

    // Bullet list
    if (line.startsWith("- ")) {
      const content = line.slice(2);
      return (
        <li key={i} className="ml-4 mb-1.5 text-sm text-[rgb(var(--muted))] leading-relaxed list-disc">
          {renderInline(content)}
        </li>
      );
    }

    // Empty line
    if (line.trim() === "") {
      return <div key={i} className="h-2" />;
    }

    // Regular paragraph
    return (
      <p key={i} className="text-sm text-[rgb(var(--muted))] leading-relaxed mb-1.5">
        {renderInline(line)}
      </p>
    );
  });
}

// Render inline markdown: **bold**, *italic*
function renderInline(text) {
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Italic: *text*
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);

    let firstMatch = null;
    let firstIndex = remaining.length;

    if (boldMatch && boldMatch.index < firstIndex) {
      firstMatch = { type: "bold", match: boldMatch };
      firstIndex = boldMatch.index;
    }
    if (italicMatch && italicMatch.index < firstIndex) {
      firstMatch = { type: "italic", match: italicMatch };
      firstIndex = italicMatch.index;
    }

    if (!firstMatch) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    // Text before match
    if (firstIndex > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, firstIndex)}</span>);
    }

    const m = firstMatch.match;
    if (firstMatch.type === "bold") {
      parts.push(
        <strong key={key++} className="font-semibold text-[rgb(var(--fg))]">
          {m[1]}
        </strong>
      );
    } else {
      parts.push(
        <em key={key++} className="italic">
          {m[1]}
        </em>
      );
    }

    remaining = remaining.slice(m.index + m[0].length);
  }

  return parts;
}

function humanizeTime(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function AISummary({ tracker }) {
  const { token } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [localSummary, setLocalSummary] = useState(null);

  const summary = localSummary || tracker.summary;
  const generatedAt = tracker.summary_generated_at;

  async function handleRegenerate() {
    if (!token || regenerating) return;
    setRegenerating(true);
    try {
      await generateSummary(tracker.id, token);
      // Reload page to get fresh summary
      window.location.reload();
    } catch (err) {
      console.error("Failed to regenerate summary:", err);
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <section className="rounded-lg border border-[rgb(var(--border))] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[rgb(var(--accent))]/5 to-transparent border-b border-[rgb(var(--border))]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[rgb(var(--accent-soft))] flex items-center justify-center">
            <Sparkles size={14} className="text-[rgb(var(--accent))]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Market Intelligence</h3>
            {generatedAt && (
              <span className="text-xs text-[rgb(var(--muted-lighter))] flex items-center gap-1">
                <Clock size={10} />
                {humanizeTime(generatedAt)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {token && (
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="p-1.5 rounded-md hover:bg-[rgb(var(--card-hover))] transition-colors text-[rgb(var(--muted))] hover:text-[rgb(var(--accent))]"
              title="Regenerate summary"
            >
              <RefreshCw size={14} className={regenerating ? "animate-spin" : ""} />
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-md hover:bg-[rgb(var(--card-hover))] transition-colors text-[rgb(var(--muted))]"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="px-5 py-4">
          {summary ? (
            <div className="summary-content">{renderMarkdown(summary)}</div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[rgb(var(--accent-soft))] flex items-center justify-center">
                <Sparkles size={20} className="text-[rgb(var(--accent))]" />
              </div>
              <p className="text-sm text-[rgb(var(--muted))] mb-1">No summary yet</p>
              <p className="text-xs text-[rgb(var(--muted-lighter))]">
                Summary will be generated automatically after the next price scrape.
              </p>
              {token && (
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[rgb(var(--accent))] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Sparkles size={12} />
                  {regenerating ? "Generating…" : "Generate now"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
