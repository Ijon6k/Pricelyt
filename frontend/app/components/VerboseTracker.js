"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Search,
  Clock,
  CheckCircle2,
  ListOrdered,
  Zap,
  Globe,
  Save,
  Brain,
} from "lucide-react";

// Human-readable step config
const STEP_META = {
  AMAZON_1: {
    label: "Scanning Amazon",
    desc: "Checking Amazon listings…",
    icon: Search,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  AMAZON_2: {
    label: "Retrying Amazon",
    desc: "Second attempt on Amazon…",
    icon: Search,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  EBAY: {
    label: "Scanning eBay",
    desc: "Checking eBay listings…",
    icon: Globe,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  SAVING: {
    label: "Saving",
    desc: "Writing price data to database…",
    icon: Save,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  SUMMARY: {
    label: "Generating summary",
    desc: "Building market analysis…",
    icon: Brain,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
};

function StepPill({ step }) {
  const meta = STEP_META[step];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${meta.color} ${meta.bg}`}
    >
      <Icon size={10} />
      {meta.label}
    </span>
  );
}

function StepProgress({ current }) {
  const steps = ["AMAZON_1", "EBAY", "SAVING", "SUMMARY"];
  const currentIdx = steps.findIndex((s) => {
    if (s === "AMAZON_1" && (current === "AMAZON_1" || current === "AMAZON_2"))
      return true;
    return s === current;
  });
  return (
    <div className="flex items-center gap-1 mt-2">
      {steps.map((s, i) => {
        const meta = STEP_META[s];
        const active = i <= currentIdx;
        return (
          <div key={s} className="flex items-center gap-1">
            <div
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                active ? `bg-current ${meta.color}` : "bg-[rgb(var(--border))]"
              }`}
            />
            {i < steps.length - 1 && (
              <div
                className={`w-4 h-px ${
                  i < currentIdx
                    ? "bg-[rgb(var(--muted))]"
                    : "bg-[rgb(var(--border))]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function VerboseTracker({ trackers }) {
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);

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
    const interval = setInterval(fetchQueue, 5_000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  if (loading) return null;

  const busy =
    (queue?.processing_count || 0) > 0 || (queue?.pending_count || 0) > 0;
  if (!busy) return null;

  // Get trackers from list that have pending status
  const pending = (trackers || []).filter((t) => t.status === "PENDING");

  return (
    <div className="mb-6 rounded-xl border border-[rgb(var(--border))]/60 bg-[rgb(var(--card))]/40 backdrop-blur-sm overflow-hidden">
      {/* Compact header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-[rgb(var(--border))]/40">
        <Loader2
          size={13}
          className="text-[rgb(var(--accent))] motion-safe:animate-spin shrink-0"
        />
        <span className="text-[11px] font-semibold tracking-widest uppercase text-[rgb(var(--muted))]">
          System Activity
        </span>
        <span className="ml-auto text-[10px] text-[rgb(var(--muted-lighter))] tabular-nums flex items-center gap-1">
          <Zap size={10} />
          {queue?.processing_count || 0} active · {queue?.pending_count || 0}{" "}
          queued
        </span>
      </div>

      {/* Currently processing */}
      {queue?.processing &&
        queue.processing.map((t) => {
          const meta = STEP_META[t.processing_step] || STEP_META.AMAZON_1;
          return (
            <div
              key={t.id}
              className="flex items-start gap-3 px-4 py-3 border-b border-[rgb(var(--border))]/20 last:border-0"
            >
              <div className="relative shrink-0 mt-0.5">
                <div
                  className={`w-6 h-6 rounded-full ${meta.bg} flex items-center justify-center`}
                >
                  <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-[rgb(var(--fg))] truncate max-w-[160px] sm:max-w-[240px]">
                    {t.keyword}
                  </span>
                  <StepPill step={t.processing_step} />
                </div>
                <p className="text-[11px] text-[rgb(var(--muted-lighter))] mt-1">
                  {meta.desc}
                </p>
                <StepProgress current={t.processing_step} />
              </div>
            </div>
          );
        })}

      {/* Queue — pending trackers with position numbers */}
      {queue?.pending_count > 0 && pending.length > 0 && (
        <div className="px-4 py-2.5 bg-[rgb(var(--border))]/10">
          <div className="flex items-center gap-2 mb-1.5">
            <Clock size={12} className="text-[rgb(var(--amber))] shrink-0" />
            <span className="text-[11px] font-medium text-[rgb(var(--muted))]">
              Queue ({queue.pending_count})
            </span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {pending.slice(0, 5).map((t) => {
              const pos = queue.positions?.[t.id];
              return (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 text-[10px] text-[rgb(var(--muted-lighter))] tabular-nums"
                >
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent))] text-[9px] font-bold">
                    {pos ?? "–"}
                  </span>
                  <span className="truncate max-w-[100px]">
                    {t.keyword}
                  </span>
                </span>
              );
            })}
            {pending.length > 5 && (
              <span className="text-[10px] text-[rgb(var(--muted-lighter))]">
                +{pending.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Idle indicator when busy count is 0 but queue is somehow active */}
      {!queue?.processing_count && queue?.pending_count === 0 && (
        <div className="flex items-center gap-2 px-4 py-3">
          <CheckCircle2
            size={13}
            className="text-emerald-500/70 shrink-0"
          />
          <span className="text-[11px] text-[rgb(var(--muted-lighter))]">
            All caught up — waiting for next scrape cycle.
          </span>
        </div>
      )}
    </div>
  );
}
