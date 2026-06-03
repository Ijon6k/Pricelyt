"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

export default function WatchlistButton({ trackerId, token }) {
  const [watched, setWatched] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check initial watch status
  useEffect(() => {
    if (!token) return;
    fetch(`/api/watchlist/${trackerId}/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setWatched(data.watched))
      .catch(() => {});
  }, [trackerId, token]);

  async function toggle() {
    if (loading) return;
    setLoading(true);

    try {
      if (watched) {
        const res = await fetch(`/api/watchlist/${trackerId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 204) {
          setWatched(false);
        }
      } else {
        const res = await fetch(`/api/watchlist/${trackerId}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setWatched(true);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      disabled={loading}
      className={`p-1.5 rounded-md transition-all ${
        watched
          ? "text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20"
          : "text-[rgb(var(--muted))] hover:text-red-400 bg-transparent hover:bg-[rgb(var(--card-hover))]"
      }`}
      title={watched ? "Remove from watchlist" : "Add to watchlist"}
    >
      <Heart
        size={14}
        fill={watched ? "currentColor" : "none"}
        className={loading ? "animate-pulse" : ""}
      />
    </button>
  );
}
