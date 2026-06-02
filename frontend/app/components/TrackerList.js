"use client";

import { useState, useMemo } from "react";
import TrackerCard from "./TrackerCard";
import TrackerRow from "./TrackerRow";
import FilterBar from "./FilterBar";
import { Loader2 } from "lucide-react";

const IN_PROGRESS_STATUSES = ["PENDING", "PROCESSING", "ERROR"];
const TRACKED_STATUSES = ["READY"];

export default function TrackerList({ trackers: initialTrackers }) {
  const [sort, setSort] = useState("newest");

  const sorted = useMemo(() => {
    const copy = [...initialTrackers];
    switch (sort) {
      case "newest":
        return copy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case "most_tracked":
        return copy.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
      default:
        return copy; // "all" — keep original order
    }
  }, [initialTrackers, sort]);

  const inProgress = sorted.filter((t) => IN_PROGRESS_STATUSES.includes(t.status));
  const tracked = sorted.filter((t) => TRACKED_STATUSES.includes(t.status));

  return (
    <>
      {/* SORT BAR */}
      {initialTrackers.length > 1 && (
        <div className="flex justify-end mb-8">
          <FilterBar active={sort} onChange={setSort} />
        </div>
      )}

      {/* IN PROGRESS SECTION — card grid */}
      {inProgress.length > 0 && (
        <section className="mb-14">
          <div className="flex items-baseline justify-between mb-6">
            <div className="flex items-center gap-2">
              <Loader2 size={12} className="animate-spin text-[rgb(var(--muted))]" />
              <h2 className="editorial-label">In progress</h2>
            </div>
            <span className="editorial-label">
              {inProgress.length} {inProgress.length === 1 ? "tracker" : "trackers"}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {inProgress.map((tracker) => (
              <TrackerCard key={tracker.id} tracker={tracker} />
            ))}
          </div>
        </section>
      )}

      {/* TRACKED SECTION — editorial table/list hybrid */}
      <section>
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="editorial-label">Tracked</h2>
          <span className="editorial-label">
            {tracked.length} {tracked.length === 1 ? "tracker" : "trackers"}
          </span>
        </div>

        {tracked.length > 0 ? (
          <div className="border-t border-[rgb(var(--border))]">
            {/* Subtle column headers — hidden on small screens */}
            <div className="hidden md:flex items-center gap-4 md:gap-6 px-2 py-2 text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted-lighter))]">
              <span className="w-[90px] shrink-0">Status</span>
              <span className="flex-1">Product</span>
              <span className="w-[80px] shrink-0 hidden md:block">Trend</span>
              <span className="w-[130px] shrink-0 text-right">Price</span>
              <span className="hidden lg:block w-[120px] shrink-0 text-right">Views · Created</span>
              <span className="w-4 shrink-0" />
            </div>
            {tracked.map((tracker, i) => (
              <TrackerRow key={tracker.id} tracker={tracker} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[rgb(var(--border))]/50 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="rgb(var(--muted))" strokeWidth="1.5">
                <path d="M3 10L7 6L11 10L17 4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-sm text-[rgb(var(--muted))]">
              {initialTrackers.length === 0
                ? "No trackers yet. Search a product to start."
                : "No active trackers yet. New trackers will appear here once data is collected."}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
