"use client";

import { useState } from "react";
import {
  Sparkles,
  ChevronDown,
  RefreshCw,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { generateSummary } from "../lib/api";

// ─── Markdown renderer ───

function renderInline(text) {
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
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

function renderMarkdown(text) {
  if (!text) return null;

  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) {
      return (
        <h3
          key={i}
          className="text-sm font-semibold text-[rgb(var(--fg))] mt-5 mb-2 tracking-tight uppercase"
        >
          {line.replace("## ", "")}
        </h3>
      );
    }
    if (line.trim() === "---") {
      return <hr key={i} className="border-[rgb(var(--border))] my-3" />;
    }
    if (line.startsWith("- ")) {
      return (
        <li
          key={i}
          className="ml-4 mb-1 text-sm text-[rgb(var(--muted))] leading-relaxed list-disc"
        >
          {renderInline(line.slice(2))}
        </li>
      );
    }
    if (line.trim() === "") {
      return <div key={i} className="h-1.5" />;
    }
    return (
      <p key={i} className="text-sm text-[rgb(var(--muted))] leading-relaxed mb-1">
        {renderInline(line)}
      </p>
    );
  });
}

// ─── Helpers ───

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

function extractHeadline(summary) {
  if (!summary) return null;
  const lines = summary.split("\n").filter((l) => l.trim());
  // Find the first line after the header that contains price info
  for (const line of lines) {
    if (line.includes("$") && !line.startsWith("#") && !line.startsWith("**")) {
      return line.trim();
    }
    // Also match lines that start with **$ (bold price)
    if (line.match(/^\*\*\$/) && !line.includes("Market Intelligence")) {
      return line.trim();
    }
  }
  return null;
}

function extractDetails(summary) {
  if (!summary) return null;
  // Everything after the first "---" separator
  const idx = summary.indexOf("---");
  if (idx === -1) return summary;
  return summary.slice(idx + 3).trim();
}

// ─── Component ───

export default function AISummary({ tracker }) {
  const { token } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [localSummary, setLocalSummary] = useState(null);
  const [error, setError] = useState(null);

  const summary = localSummary || tracker.summary;
  const generatedAt = tracker.summary_generated_at;
  const dataPoints = tracker.price_logs?.length || 0;
  const hasEnoughData = dataPoints >= 3;

  const headline = extractHeadline(summary);
  const details = extractDetails(summary);

  async function handleRegenerate() {
    if (!token || regenerating) return;
    setRegenerating(true);
    setError(null);
    try {
      await generateSummary(tracker.id, token);
      window.location.reload();
    } catch (err) {
      setError(err.message || "Failed to generate summary");
    } finally {
      setRegenerating(false);
    }
  }

  // Not enough data — show minimal state
  if (!summary && !hasEnoughData) {
    return (
      <section className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card)))] overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[rgb(var(--accent-soft))] flex items-center justify-center shrink-0">
            <Sparkles size={15} className="text-[rgb(var(--accent))]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">
              Market Intelligence
            </h3>
            <p className="text-xs text-[rgb(var(--muted-lighter))] mt-0.5">
              Summary will be generated automatically once enough data is collected
              ({dataPoints}/3 data points).
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-[rgb(var(--border))]">
          <div
            className="h-full bg-[rgb(var(--accent))] transition-all duration-500"
            style={{ width: `${Math.min(100, (dataPoints / 3) * 100)}%` }}
          />
        </div>
      </section>
    );
  }

  // Has summary — show insight card
  return (
    <section className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-hidden">
      {/* Left accent border + content */}
      <div className="flex">
        {/* Accent bar */}
        <div className="w-1 bg-[rgb(var(--accent))] shrink-0" />

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[rgb(var(--accent-soft))] flex items-center justify-center">
                <Sparkles size={14} className="text-[rgb(var(--accent))]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">
                  Market Intelligence
                </h3>
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
                  <RefreshCw
                    size={14}
                    className={regenerating ? "animate-spin" : ""}
                  />
                </button>
              )}
              {details && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="p-1.5 rounded-md hover:bg-[rgb(var(--card-hover))] transition-colors text-[rgb(var(--muted))]"
                >
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                  />
                </button>
              )}
            </div>
          </div>

          {/* Headline insight — always visible, prominent */}
          {headline && (
            <div className="px-5 pb-3">
              <p className="summary-headline">{renderInline(headline)}</p>
            </div>
          )}

          {/* Trust signals — data points + sources */}
          <div className="px-5 pb-3 flex items-center gap-3">
            <span className="text-xs text-[rgb(var(--muted-lighter))]">
              Based on {dataPoints} price snapshots
            </span>
            {tracker.news_logs?.length > 0 && (
              <>
                <span className="ornament-dot" />
                <span className="text-xs text-[rgb(var(--muted-lighter))]">
                  {tracker.news_logs.length} news articles
                </span>
              </>
            )}
          </div>

          {/* Expandable details */}
          {expanded && details && (
            <div className="px-5 pb-4 pt-1 border-t border-[rgb(var(--border))]/50">
              <div className="summary-content">{renderMarkdown(details)}</div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="px-5 pb-3 flex items-center gap-2 text-xs text-[rgb(var(--danger))]">
              <AlertTriangle size={12} />
              {error}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
