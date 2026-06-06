"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Loader2,
  Search,
  Clock,
  CheckCircle2,
  Zap,
  Globe,
  Save,
  Brain,
  RotateCw,
  Activity,
} from "lucide-react";

// ─── Step config ───
const STEP_META = {
  AMAZON_1: {
    label: "Scanning Amazon",
    desc: "Checking Amazon listings…",
    icon: Search,
    color: "text-amber-500",
    dot: "bg-amber-500",
  },
  AMAZON_2: {
    label: "Retrying Amazon",
    desc: "Second attempt on Amazon…",
    icon: RotateCw,
    color: "text-orange-500",
    dot: "bg-orange-500",
  },
  EBAY: {
    label: "Scanning eBay",
    desc: "Checking eBay listings…",
    icon: Globe,
    color: "text-blue-500",
    dot: "bg-blue-500",
  },
  SAVING: {
    label: "Saving data",
    desc: "Writing price data to database…",
    icon: Save,
    color: "text-emerald-500",
    dot: "bg-emerald-500",
  },
  SUMMARY: {
    label: "Generating summary",
    desc: "Building market analysis with AI…",
    icon: Brain,
    color: "text-violet-500",
    dot: "bg-violet-500",
  },
};

const PIPELINE_STEPS = ["AMAZON_1", "EBAY", "SAVING", "SUMMARY"];

// ─── Pipeline dots (mini progress bar) ───

function PipelineDots({ current }) {
  const currentIdx = PIPELINE_STEPS.findIndex((s) => {
    if (s === "AMAZON_1" && (current === "AMAZON_1" || current === "AMAZON_2"))
      return true;
    return s === current;
  });

  return (
    <div className="flex items-center gap-0.5">
      {PIPELINE_STEPS.map((s, i) => {
        const meta = STEP_META[s];
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s} className="flex items-center">
            <div
              className={`w-1 h-1 rounded-full transition-all duration-300 ${
                done
                  ? `${meta.dot} opacity-60`
                  : active
                    ? `${meta.dot} shadow-[0_0_4px] shadow-current ${meta.color}`
                    : "bg-[rgb(var(--border))]"
              }`}
            />
            {i < PIPELINE_STEPS.length - 1 && (
              <div
                className={`w-2 h-px transition-colors ${
                  i < currentIdx ? "bg-[rgb(var(--muted))]/40" : "bg-transparent"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Processing item ───

function ProcessingItem({ tracker }) {
  const meta = STEP_META[tracker.processing_step] || STEP_META.AMAZON_1;
  const Icon = meta.icon;
  const isRescrape = (tracker.rescrape_count || 0) > 0;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className="relative shrink-0">
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center ${meta.color}`}
        >
          <Icon size={11} className="motion-safe:animate-pulse" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[rgb(var(--fg))] truncate max-w-[180px]">
            {tracker.keyword}
          </span>
          {isRescrape && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-px rounded text-[9px] font-semibold uppercase tracking-wider bg-amber-500/8 text-amber-600 dark:text-amber-400">
              <RotateCw size={8} />
              re-scrape #{tracker.rescrape_count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[10px] font-medium ${meta.color}`}>
            {meta.label}
          </span>
          <PipelineDots current={tracker.processing_step} />
        </div>
      </div>
    </div>
  );
}

// ─── Queue item (pending tracker with position) ───

function QueueItem({ tracker, position, total }) {
  return (
    <div className="flex items-center gap-2 px-4 py-1.5">
      <div className="flex items-center justify-center w-5 h-5 rounded bg-[rgb(var(--border))]/60 shrink-0">
        <span className="text-[9px] font-bold tabular-nums text-[rgb(var(--muted))]">
          {position}
        </span>
      </div>
      <span className="text-xs text-[rgb(var(--muted))] truncate flex-1">
        {tracker.keyword}
      </span>
      <span className="text-[9px] text-[rgb(var(--muted-lighter))] tabular-nums shrink-0">
        {position}/{total}
      </span>
    </div>
  );
}

// ─── Main component ───

export default function VerboseTracker({ trackers }) {
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const prevBusyRef = useRef(false);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/queue", { cache: "no-store" });
      if (res.ok) setQueue(await res.json());
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 4_000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Track when system goes from busy to idle (for "just finished" flash)
  const [justFinished, setJustFinished] = useState(false);
  const busy =
    (queue?.processing_count || 0) > 0 || (queue?.pending_count || 0) > 0;

  useEffect(() => {
    if (prevBusyRef.current && !busy) {
      setJustFinished(true);
      const t = setTimeout(() => setJustFinished(false), 8000);
      return () => clearTimeout(t);
    }
    prevBusyRef.current = busy;
  }, [busy]);

  // Don't render anything if idle and no flash
  if (!busy && !justFinished) return null;

  // Get pending trackers with queue positions
  const pending = (trackers || [])
    .filter((t) => t.status === "PENDING")
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  return (
    <div className="mb-8 rounded-lg border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))]/30 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[rgb(var(--border))]/30">
        {busy ? (
          <Activity
            size={12}
            className="text-[rgb(var(--accent))] motion-safe:animate-pulse shrink-0"
          />
        ) : (
          <CheckCircle2 size={12} className="text-emerald-500/80 shrink-0" />
        )}
        <span className="text-[10px] font-semibold tracking-widest uppercase text-[rgb(var(--muted))]">
          {busy ? "Processing" : "System idle"}
        </span>

        <div className="ml-auto flex items-center gap-2">
          {(queue?.processing_count || 0) > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-px rounded bg-[rgb(var(--accent))]/8 text-[9px] font-semibold text-[rgb(var(--accent))] tabular-nums">
              <Zap size={8} />
              {queue.processing_count} active
            </span>
          )}
          {(queue?.pending_count || 0) > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-px rounded bg-amber-500/8 text-[9px] font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
              <Clock size={8} />
              {queue.pending_count} queued
            </span>
          )}
        </div>
      </div>

      {/* Processing trackers */}
      {queue?.processing &&
        queue.processing.map((t) => (
          <ProcessingItem key={t.id} tracker={t} />
        ))}

      {/* Queue list with position numbers */}
      {pending.length > 0 && (
        <div className="border-t border-[rgb(var(--border))]/20">
          <div className="px-4 py-1.5 bg-[rgb(var(--border))]/5">
            <span className="text-[9px] font-medium text-[rgb(var(--muted-lighter))] uppercase tracking-wider">
              Queue · {pending.length} waiting
            </span>
          </div>
          {pending.slice(0, 8).map((t, i) => (
            <QueueItem
              key={t.id}
              tracker={t}
              position={i + 1}
              total={pending.length}
            />
          ))}
          {pending.length > 8 && (
            <div className="px-4 py-1.5">
              <span className="text-[10px] text-[rgb(var(--muted-lighter))]">
                +{pending.length - 8} more in queue
              </span>
            </div>
          )}
        </div>
      )}

      {/* Just-finished flash */}
      {justFinished && !busy && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-[rgb(var(--border))]/20">
          <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
          <span className="text-[11px] text-[rgb(var(--muted))]">
            All done — waiting for next scrape cycle.
          </span>
        </div>
      )}
    </div>
  );
}
