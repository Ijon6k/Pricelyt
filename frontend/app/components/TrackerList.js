"use client";

import { useState } from "react";
import TrackerCard from "./TrackerCard";
import TrackerRow from "./TrackerRow";
import FilterBar from "./FilterBar";

const IN_PROGRESS_STATUSES = ["PENDING", "PROCESSING"];
const TRACKED_STATUSES = ["READY"];
const ARCHIVED_STATUSES = ["ERROR"];

export default function TrackerList({ trackers: initialTrackers, onWatchlistChange }) {
  const [sort, setSort] = useState("newest");
  const [showArchived, setShowArchived] = useState(false);

  const sorted = (() => {
    const copy = [...initialTrackers];
    switch (sort) {
      case "newest":
        return copy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case "most_tracked":
        return copy.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
      case "price_low":
        return copy.sort((a, b) => (a.latest_price || 0) - (b.latest_price || 0));
      case "price_high":
        return copy.sort((a, b) => (b.latest_price || 0) - (a.latest_price || 0));
      default:
        return copy;
    }
  })();

  const inProgress = sorted.filter((t) => IN_PROGRESS_STATUSES.includes(t.status));
  const tracked = sorted.filter((t) => TRACKED_STATUSES.includes(t.status));
  const archived = sorted.filter((t) => ARCHIVED_STATUSES.includes(t.status));

  return (
    <>
      {/* Sort bar */}
      {initialTrackers.length > 1 && (
        <div className="flex items-center justify-between mb-6">
          <FilterBar active={sort} onChange={setSort} />
          <span className="text-[11px] text-[rgb(var(--muted-lighter))] tabular-nums">
            {tracked.length} tracked
          </span>
        </div>
      )}

      {/* In Progress — compact cards */}
      {inProgress.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="editorial-label">In progress</span>
            <span className="text-[10px] text-[rgb(var(--muted-lighter))] tabular-nums">
              {inProgress.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {inProgress.map((tracker) => (
              <TrackerCard key={tracker.id} tracker={tracker} />
            ))}
          </div>
        </section>
      )}

      {/* Tracked — editorial list */}
      <section className="mb-10">
        {tracked.length > 0 ? (
          <div>
            {/* Column headers (desktop) */}
            <div className="hidden md:flex items-center gap-3 sm:gap-4 lg:gap-6 px-0 py-2 text-[10px] font-medium uppercase tracking-[0.1em] text-[rgb(var(--muted-lighter))] border-b border-[rgb(var(--border))]">
              <span className="hidden lg:block w-5 shrink-0" />
              <span className="w-4 shrink-0" />
              <span className="flex-1">Product</span>
              <span className="w-[72px] shrink-0 hidden md:block">Trend</span>
              <span className="w-[120px] shrink-0 text-right">Price</span>
              <span className="hidden xl:block w-[100px] shrink-0 text-right">Views &middot; Date</span>
              <span className="w-8 shrink-0" />
            </div>
            {tracked.map((tracker, i) => (
              <TrackerRow key={tracker.id} tracker={tracker} rank={i + 1} onWatchlistChange={onWatchlistChange} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-xs text-[rgb(var(--muted))]">
              {initialTrackers.length === 0
                ? "No trackers yet. Search a product to start."
                : "No active trackers yet. Data is being collected."}
            </p>
          </div>
        )}
      </section>

      {/* Archive — collapsible */}
      {archived.length > 0 && (
        <section>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 mb-3 group"
          >
            <span className="editorial-label group-hover:text-[rgb(var(--fg))] transition-colors">
              Archived
            </span>
            <span className="text-[10px] text-[rgb(var(--danger))] bg-[rgb(var(--danger-soft))] px-1.5 py-0.5 rounded-sm font-medium tabular-nums">
              {archived.length}
            </span>
            <svg
              width="10" height="10" viewBox="0 0 12 12" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              className={`text-[rgb(var(--muted-lighter))] transition-transform duration-200 ${showArchived ? "rotate-180" : ""}`}
            >
              <path d="M3 4.5L6 7.5L9 4.5" />
            </svg>
          </button>

          {showArchived && (
            <div>
              {archived.map((tracker) => (
                <TrackerRow key={tracker.id} tracker={tracker} onWatchlistChange={onWatchlistChange} />
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
