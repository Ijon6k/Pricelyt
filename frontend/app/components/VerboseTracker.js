"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  ListOrdered,
  BarChart3,
} from "lucide-react";

const SCAVENGE_MESSAGES = [
  "Scouting for scraps…",
  "Sniffing the market…",
  "Digging through listings…",
  "Chasing prices…",
  "Combing the aisles…",
  "Hunting for deals…",
  "Prowling the web…",
  "Rummaging for data…",
  "Tracking the trail…",
  "Browsing the bazaar…",
];

function randomMsg(seed) {
  return SCAVENGE_MESSAGES[seed % SCAVENGE_MESSAGES.length];
}

export default function VerboseTracker({ trackers }) {
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/queue", { cache: "no-store" });
      if (res.ok) {
        setQueue(await res.json());
      }
    } catch {
      // silent — queue status is non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10_000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Find which trackers are in the queue
  const processing = (trackers || []).filter(
    (t) => t.status === "PROCESSING",
  );
  const pending = (trackers || []).filter((t) => t.status === "PENDING");

  if (loading) return null;

  const totalBusy = processing.length + (queue?.pending_count || 0);

  // Don't render anything if nothing is happening
  if (totalBusy === 0 && !processing.length) return null;

  return (
    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]/50 overflow-hidden">
      {/* Lightweight header bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[rgb(var(--border))]/50">
        <RefreshCw
          size={14}
          className="text-[rgb(var(--accent))] motion-safe:animate-spin"
        />
        <span className="text-xs font-medium text-[rgb(var(--fg))] tracking-wide uppercase">
          Activity
        </span>
        {queue && (
          <span className="ml-auto text-[11px] text-[rgb(var(--muted))] tabular-nums flex items-center gap-1.5">
            <BarChart3 size={12} />
            {queue.pending_count} queued · {queue.processing_count} processing
          </span>
        )}
      </div>

      {/* Currently processing */}
      {processing.map((t, idx) => {
        const msg = randomMsg(
          t.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0),
        );
        return (
          <div
            key={t.id}
            className="flex items-center gap-3 px-4 py-3 border-b border-[rgb(var(--border))]/30 last:border-0"
          >
            <div className="relative shrink-0">
              <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center motion-safe:animate-pulse">
                <Search size={12} className="text-blue-500" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[rgb(var(--fg))] truncate max-w-[140px] sm:max-w-[200px]">
                  {t.keyword}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-medium uppercase tracking-wider">
                  Scraping
                </span>
              </div>
              <p className="text-[11px] text-[rgb(var(--muted-lighter))] mt-0.5 italic">
                {msg}
              </p>
            </div>
          </div>
        );
      })}

      {/* Queue depth indicator */}
      {queue && queue.pending_count > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[rgb(var(--amber))]/5">
          <Clock size={12} className="text-[rgb(var(--amber))] shrink-0" />
          <span className="text-[11px] text-[rgb(var(--muted))]">
            <strong className="text-[rgb(var(--fg))]">
              {queue.pending_count}
            </strong>{" "}
            tracker{queue.pending_count !== 1 ? "s" : ""} in queue
          </span>
          {/* Show position for tracked items */}
          {queue.positions &&
            pending.length > 0 &&
            pending.slice(0, 3).map((t) => {
              const pos = queue.positions[t.id];
              if (!pos) return null;
              return (
                <span
                  key={t.id}
                  className="ml-auto text-[10px] text-[rgb(var(--muted-lighter))] tabular-nums"
                >
                  <ListOrdered size={10} className="inline mr-0.5" />
                  {t.keyword.substring(0, 16)}: #{pos}
                </span>
              );
            })}
        </div>
      )}

      {/* Recently completed (from tracker list) */}
      {!processing.length && queue?.pending_count === 0 && (
        <div className="flex items-center gap-2 px-4 py-3">
          <CheckCircle2 size={14} className="text-emerald-500/70 shrink-0" />
          <span className="text-[11px] text-[rgb(var(--muted-lighter))]">
            All caught up. Waiting for next scrape cycle.
          </span>
        </div>
      )}
    </div>
  );
}
