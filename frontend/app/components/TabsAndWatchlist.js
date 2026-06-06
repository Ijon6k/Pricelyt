"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../lib/AuthContext";
import TrackerList from "./TrackerList";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

function TabButton({ active, onClick, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`relative shrink-0 px-3.5 py-2 text-xs font-medium transition-colors rounded-md ${
        active
          ? "text-[rgb(var(--fg))] bg-[rgb(var(--card))] border border-[rgb(var(--border))]"
          : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] border border-transparent"
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className="ml-1.5 text-[10px] text-[rgb(var(--muted-lighter))] tabular-nums">
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

  useEffect(() => {
    if (tab === "watchlist" && user) fetchWatchlist();
  }, [tab, user, fetchWatchlist]);

  const displayedTrackers = tab === "watchlist" ? watchlist : trackers;

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-8">
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
          <p className="text-sm font-medium text-[rgb(var(--fg))] mb-1">Login required</p>
          <p className="text-xs text-[rgb(var(--muted))]">
            Sign in to create your personal watchlist.
          </p>
        </div>
      )}

      {tab === "watchlist" && user && !wlLoading && watchlist.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm font-medium text-[rgb(var(--fg))] mb-1">Your watchlist is empty</p>
          <p className="text-xs text-[rgb(var(--muted))]">
            Tap the heart icon on any product to add it.
          </p>
        </div>
      )}

      {(tab !== "watchlist" || (user && !wlLoading)) && (
        <TrackerList trackers={displayedTrackers} onWatchlistChange={fetchWatchlist} />
      )}
    </div>
  );
}
