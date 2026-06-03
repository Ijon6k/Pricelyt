"use client";

import { useState, useEffect, useCallback } from "react";
import { Heart, LogIn, Loader2 } from "lucide-react";
import TrackerCard from "./TrackerCard";
import TrackerRow from "./TrackerRow";
import { useAuth } from "../lib/AuthContext";

function getBaseUrl() {
  if (typeof window === "undefined") return "http://api:8080/api";
  return "/api";
}

async function fetchWatchlist(token) {
  const res = await fetch(`${getBaseUrl()}/watchlist`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch watchlist");
  return res.json();
}

async function toggleWatchlist(trackerId, watched, token) {
  const method = watched ? "DELETE" : "POST";
  const res = await fetch(`${getBaseUrl()}/watchlist/${trackerId}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed");
  return watched ? null : { watched: true };
}

export default function WatchlistTab({ allTrackers, activeTab, setActiveTab }) {
  const { user, token } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchWatchlist(token);
      setWatchlist(data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === "watchlist") {
      load();
    }
  }, [activeTab, load]);

  // Love button for each tracker card
  const WatchlistLoveButton = ({ trackerId, initialWatched }) => {
    const [watched, setWatched] = useState(initialWatched);
    const [toggling, setToggling] = useState(false);

    const handleToggle = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!token) return;

      setToggling(true);
      try {
        await toggleWatchlist(trackerId, watched, token);
        setWatched(!watched);
        // Also update parent watchlist
        if (watched) {
          setWatchlist((prev) => prev.filter((t) => t.id !== trackerId));
        } else {
          // Refresh watchlist to get the new item
          load();
        }
      } catch {
        // silent
      } finally {
        setToggling(false);
      }
    };

    return (
      <button
        onClick={handleToggle}
        disabled={toggling || !token}
        className={`p-1.5 rounded-lg transition-all ${
          watched
            ? "text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-500/10"
            : "text-[rgb(var(--muted-lighter))] hover:text-red-400 hover:bg-[rgb(var(--card-hover))]"
        }`}
        title={watched ? "Remove from watchlist" : "Add to watchlist"}
      >
        <Heart
          size={16}
          className={watched ? "fill-current" : ""}
        />
      </button>
    );
  };

  const isActive = activeTab === "watchlist";

  return (
    <>
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-8">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !isActive
              ? "bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent))]"
              : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
          }`}
        >
          All Trackers
        </button>
        <button
          onClick={() => setActiveTab("watchlist")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            isActive
              ? "bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent))]"
              : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
          }`}
        >
          <Heart size={14} className={isActive ? "text-red-500" : ""} />
          Watchlist
          {watchlist.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              isActive ? "bg-[rgb(var(--accent))] text-white" : "bg-[rgb(var(--border))] text-[rgb(var(--muted))]"
            }`}>
              {watchlist.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {!isActive ? null : !token ? (
        <div className="py-20 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[rgb(var(--border))]/50 flex items-center justify-center">
            <LogIn size={24} className="text-[rgb(var(--muted))]" />
          </div>
          <h3 className="text-lg font-semibold text-[rgb(var(--fg))] mb-2">Login required</h3>
          <p className="text-sm text-[rgb(var(--muted))] mb-6">
            Sign in to save products to your watchlist. Tap the{" "}
            <Heart size={12} className="inline text-red-400" /> on any product to add it.
          </p>
        </div>
      ) : loading ? (
        <div className="py-16 text-center">
          <Loader2 size={20} className="animate-spin mx-auto text-[rgb(var(--accent))]" />
        </div>
      ) : watchlist.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[rgb(var(--border))]/50 flex items-center justify-center">
            <Heart size={24} className="text-[rgb(var(--muted))]" />
          </div>
          <h3 className="text-lg font-semibold text-[rgb(var(--fg))] mb-2">No watchlist yet</h3>
          <p className="text-sm text-[rgb(var(--muted))]">
            Tap the <Heart size={12} className="inline text-red-400" /> on any product to add it here.
          </p>
        </div>
      ) : (
        <div className="border-t border-[rgb(var(--border))]">
          <div className="hidden md:flex items-center gap-4 md:gap-6 px-2 py-2 text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted-lighter))]">
            <span className="w-[90px] shrink-0">Status</span>
            <span className="flex-1">Product</span>
            <span className="w-[80px] shrink-0 hidden md:block">Trend</span>
            <span className="w-[130px] shrink-0 text-right">Price</span>
            <span className="hidden lg:block w-[120px] shrink-0 text-right">Views · Created</span>
            <span className="w-4 shrink-0" />
          </div>
          {watchlist.map((tracker) => (
            <TrackerRow key={tracker.id} tracker={tracker} />
          ))}
        </div>
      )}
    </>
  );
}

export { WatchlistLoveButton };
