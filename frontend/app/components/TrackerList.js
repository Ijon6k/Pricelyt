"use client";

import { useState } from "react";
import TrackerCard from "./TrackerCard";
import TrackerRow from "./TrackerRow";
import FilterBar from "./FilterBar";
import ViewToggle from "./ViewToggle";
import { Loader2, Archive } from "lucide-react";

const IN_PROGRESS_STATUSES = ["PENDING", "PROCESSING"];
const TRACKED_STATUSES = ["READY"];
const ARCHIVED_STATUSES = ["ERROR"];

export default function TrackerList({ trackers: initialTrackers, onWatchlistChange }) {
  const [sort, setSort] = useState("newest");
  const [viewMode, setViewMode] = useState("list");
  const [showArchived, setShowArchived] = useState(false);

  const sorted = (() => {
    const copy = [...initialTrackers];
    switch (sort) {
      case "newest":
        return copy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case "most_tracked":
        return copy.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
      default:
        return copy;
    }
  })();

  const inProgress = sorted.filter((t) => IN_PROGRESS_STATUSES.includes(t.status));
  const tracked = sorted.filter((t) => TRACKED_STATUSES.includes(t.status));
  const archived = sorted.filter((t) => ARCHIVED_STATUSES.includes(t.status));

  return (
    <>
      {/* SORT + VIEW TOGGLE */}
      {initialTrackers.length > 1 && (
        <div className="flex flex-wrap items-center justify-between mb-8 gap-3">
          <FilterBar active={sort} onChange={setSort} />
          <ViewToggle active={viewMode} onChange={setViewMode} />
        </div>
      )}

      {/* IN PROGRESS SECTION */}
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

          {/* In-progress always uses card grid — no view mode here */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {inProgress.map((tracker) => (
              <TrackerCard key={tracker.id} tracker={tracker} />
            ))}
          </div>
        </section>
      )}

      {/* TRACKED SECTION */}
      <section className="mb-14">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="editorial-label">Tracked</h2>
          <span className="editorial-label">
            {tracked.length} {tracked.length === 1 ? "tracker" : "trackers"}
          </span>
        </div>

        {tracked.length > 0 ? (
          viewMode === "grid" ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {tracked.map((tracker) => (
                <TrackerCard key={tracker.id} tracker={tracker} />
              ))}
            </div>
          ) : viewMode === "table" ? (
            /* TABLE VIEW — compact rows */
            <div className="border-t border-[rgb(var(--border))]">
              <div className="hidden md:flex items-center gap-2 px-2 py-2 text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted-lighter))]">
                <span className="w-[28px] shrink-0" />
                <span className="w-[90px] shrink-0">Status</span>
                <span className="flex-1">Product</span>
                <span className="w-[80px] shrink-0 hidden md:block">Trend</span>
                <span className="w-[130px] shrink-0 text-right">Price</span>
                <span className="hidden lg:block w-[120px] shrink-0 text-right">Views · Created</span>
                <span className="w-4 shrink-0" />
              </div>
              {tracked.map((tracker, i) => (
                <TrackerRow key={tracker.id} tracker={tracker} rank={i + 1} />
              ))}
            </div>
          ) : (
            /* LIST VIEW (default) — editorial table/list hybrid */
            <div className="border-t border-[rgb(var(--border))]">
              <div className="hidden md:flex items-center gap-4 md:gap-6 px-2 py-2 text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted-lighter))]">
                <span className="w-[90px] shrink-0">Status</span>
                <span className="flex-1">Product</span>
                <span className="w-[80px] shrink-0 hidden md:block">Trend</span>
                <span className="w-[130px] shrink-0 text-right">Price</span>
                <span className="hidden lg:block w-[120px] shrink-0 text-right">Views · Created</span>
                <span className="w-4 shrink-0" />
              </div>
              {tracked.map((tracker) => (
                <TrackerRow key={tracker.id} tracker={tracker} />
              ))}
            </div>
          )
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

      {/* ARCHIVE SECTION */}
      {archived.length > 0 && (
        <section>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 mb-4 group"
          >
            <Archive size={14} className="text-[rgb(var(--muted))] group-hover:text-[rgb(var(--fg))] transition-colors" />
            <h2 className="editorial-label group-hover:text-[rgb(var(--fg))] transition-colors">
              Archive
            </h2>
            <span className="text-xs text-[rgb(var(--danger))] bg-[rgb(var(--danger))]/8 px-1.5 py-0.5 rounded-full font-medium">
              {archived.length}
            </span>
            <ChevronIcon open={showArchived} />
          </button>

          {showArchived && (
            <div className="border-t border-[rgb(var(--border))]">
              <div className="hidden md:flex items-center gap-4 md:gap-6 px-2 py-2 text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted-lighter))]">
                <span className="w-[90px] shrink-0">Status</span>
                <span className="flex-1">Product</span>
                <span className="w-[80px] shrink-0 hidden md:block">Trend</span>
                <span className="w-[130px] shrink-0 text-right">Price</span>
                <span className="hidden lg:block w-[120px] shrink-0 text-right">Views · Created</span>
                <span className="w-4 shrink-0" />
              </div>
              {archived.map((tracker) => (
                <TrackerRow key={tracker.id} tracker={tracker} />
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-[rgb(var(--muted))] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M3 4.5L6 7.5L9 4.5" />
    </svg>
  );
}
