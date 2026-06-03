"use client";

import { useState } from "react";
import { useAuth } from "../lib/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

export default function LoveButton({ trackerId, size = 18, className = "" }) {
  const { user } = useAuth();
  const [watched, setWatched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("pricelyt_token") : null;

  async function toggle(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user || loading) return;
    setLoading(true);
    try {
      if (watched) {
        await fetch(`${API_BASE}/watchlist/${trackerId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setWatched(false);
      } else {
        await fetch(`${API_BASE}/watchlist/${trackerId}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        setWatched(true);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  // Not logged in — show ghost heart, click triggers nothing but looks inviting
  if (!user) {
    return (
      <button
        className={`group/love transition-all ${className}`}
        title="Login to add to watchlist"
        aria-label="Login to add to watchlist"
        disabled
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgb(var(--muted))"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="group-hover/love:stroke-red-400 transition-colors"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={loading}
      className={`group/love transition-all ${loading ? "opacity-50" : ""} ${className}`}
      title={watched ? "Remove from watchlist" : "Add to watchlist"}
      aria-label={watched ? "Remove from watchlist" : "Add to watchlist"}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={watched ? "rgb(239, 68, 68)" : hover ? "rgba(239, 68, 68, 0.3)" : "none"}
        stroke={watched ? "rgb(239, 68, 68)" : "rgb(var(--muted))"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="group-hover/love:stroke-red-400 group-hover/love:fill-red-400/30 transition-all"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
