"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../lib/AuthContext";
import TrackerList from "./TrackerList";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

function TabButton({ active, onClick, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors rounded-lg ${
        active
          ? "text-[rgb(var(--fg))] bg-[rgb(var(--card))] shadow-sm"
          : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className="ml-1.5 text-[11px] text-[rgb(var(--muted-lighter))] tabular-nums">
          ({count})
        </span>
      )}
    </button>
  );
}

export default function TabsAndWatchlist({ trackers }) {
  const { user } = useAuth();
  const [tab, setTab] = useState("all");
  const [watchlist, setWatchlist] = useState([]);
  const [wlLoading, setWlLoading] = useState(false);

  const fetchWatchlist = useCallback(async () => {
    if (!user) return;
    setWlLoading(true);
    try {
      const token = localStorage.getItem("pricelyt_token");
      const res = await fetch(`${API_BASE}/watchlist`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setWatchlist(data || []);
      }
    } catch {
      // silent
    } finally {
      setWlLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  // Refresh on tab switch to watchlist
  useEffect(() => {
    if (tab === "watchlist" && user) fetchWatchlist();
  }, [tab, user, fetchWatchlist]);

  const displayedTrackers = tab === "watchlist" ? watchlist : trackers;

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[rgb(var(--border))]/30 w-full sm:w-fit mb-8 overflow-x-auto">
        <TabButton
          active={tab === "all"}
          onClick={() => setTab("all")}
          label="All Trackers"
          count={trackers.length}
        />
        <TabButton
          active={tab === "watchlist"}
          onClick={() => setTab("watchlist")}
          label="Watchlist"
          count={user ? watchlist.length : undefined}
        />
      </div>

      {tab === "watchlist" && !user && (
        <div className="py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[rgb(var(--card))] flex items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgb(var(--muted))"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[rgb(var(--fg))] mb-2">
            Login required
          </h3>
          <p className="text-sm text-[rgb(var(--muted))] max-w-sm mx-auto leading-relaxed">
            Sign in to create your personal watchlist. Tap the heart icon on any
            product to save it here.
          </p>
        </div>
      )}

      {tab === "watchlist" && user && !wlLoading && watchlist.length === 0 && (
        <div className="py-16 text-center">
          <h3 className="text-lg font-semibold text-[rgb(var(--fg))] mb-2">
            Your watchlist is empty
          </h3>
          <p className="text-sm text-[rgb(var(--muted))] max-w-sm mx-auto leading-relaxed">
            Tap the{" "}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="inline text-red-400"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>{" "}
            icon on any product to add it here.
          </p>
        </div>
      )}

      {(tab !== "watchlist" || (user && !wlLoading)) && (
        <TrackerList trackers={displayedTrackers} onWatchlistChange={fetchWatchlist} />
      )}
    </div>
  );
}
