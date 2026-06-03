"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

export default function HeartToggle({
  trackerId,
  token,
  onToggle,
  filled: forceFilled,
  compact,
}) {
  const [loved, setLoved] = useState(false);
  const [pending, setPending] = useState(false);

  // Sync initial state
  useEffect(() => {
    setLoved(!!forceFilled);
  }, [forceFilled]);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending || !token) return;
    setPending(true);
    try {
      await onToggle();
      setLoved((prev) => !prev);
    } catch {
      // silent
    } finally {
      setPending(false);
    }
  };

  if (!token) return null;

  const sizeClass = compact ? "p-1" : "p-1.5";
  const iconSize = compact ? 14 : 16;

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={`${sizeClass} rounded-md transition-all hover:scale-110 ${
        loved
          ? "text-red-400 hover:text-red-500"
          : "text-[rgb(var(--muted-lighter))] hover:text-red-400"
      } ${pending ? "opacity-50" : ""}`}
      title={loved ? "Remove from watchlist" : "Add to watchlist"}
    >
      <Heart
        size={iconSize}
        fill={loved ? "currentColor" : "none"}
        className={loved ? "motion-safe:animate-pulse" : ""}
      />
    </button>
  );
}
