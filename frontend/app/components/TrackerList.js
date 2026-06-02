"use client";

import { useState, useMemo } from "react";
import TrackerCard from "./TrackerCard";
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
        <div className="flex justify-end mb-6">
          <FilterBar active={sort} onChange={setSort} />
        </div>
      )}

      {/* IN PROGRESS SECTION */}
      {inProgress.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-6">
            <div className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-[rgb(var(--muted))]" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                In progress
              </h2>
            </div>
            <span className="text-sm text-[rgb(var(--muted))]">
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

      {/* TRACKED SECTION */}
      <section className={inProgress.length > 0 ? "mt-12" : ""}>
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
            Tracked
          </h2>
          <span className="text-sm text-[rgb(var(--muted))]">
            {tracked.length} {tracked.length === 1 ? "tracker" : "trackers"}
          </span>
        </div>

        {tracked.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tracked.map((tracker) => (
              <TrackerCard key={tracker.id} tracker={tracker} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center border border-dashed border-[rgb(var(--border))] rounded-xl">
            <p className="text-[rgb(var(--muted))]">
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
