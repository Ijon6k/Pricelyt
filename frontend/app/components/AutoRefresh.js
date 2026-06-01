"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Refreshes the server component on an interval while the tracker is still
// being worked on, so the UI flips to READY (and shows price/news) without a
// manual reload. Stops polling once the status settles.
export default function AutoRefresh({ status, intervalMs = 5000 }) {
  const router = useRouter();

  useEffect(() => {
    const active = status === "PENDING" || status === "PROCESSING";
    if (!active) return;

    const timer = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [status, intervalMs, router]);

  return null;
}
