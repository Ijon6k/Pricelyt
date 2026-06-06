import Link from "next/link";
import { Loader2, Clock, AlertTriangle } from "lucide-react";

export default function TrackerCard({ tracker }) {
  const {
    id = "",
    keyword = "Unknown item",
    status = "PENDING",
    created_at,
    error_count = 0,
  } = tracker || {};

  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      })
    : "";

  const getStatusLabel = (s) => {
    switch (s) {
      case "PROCESSING": return { icon: <Loader2 size={11} className="animate-spin" />, text: "Processing", cls: "text-blue-500" };
      case "PENDING": return { icon: <Clock size={11} />, text: "Queued", cls: "text-[rgb(var(--warning))]" };
      case "ERROR": return { icon: <AlertTriangle size={11} />, text: "Error", cls: "text-[rgb(var(--danger))]" };
      default: return { icon: null, text: s, cls: "text-[rgb(var(--muted))]" };
    }
  };

  const cfg = getStatusLabel(status);

  return (
    <Link href={`/trackers/${id}`} className="group block no-underline">
      <div className="border border-[rgb(var(--border))] rounded-md px-4 py-3 hover:border-[rgb(var(--accent))]/30 transition-colors">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-[13px] font-medium text-[rgb(var(--fg))] group-hover:text-[rgb(var(--accent))] transition-colors truncate">
              {keyword}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`flex items-center gap-1 text-[10px] font-medium ${cfg.cls}`}>
                {cfg.icon}
                {cfg.text}
              </span>
              <span className="text-[10px] text-[rgb(var(--muted-lighter))]">{formattedDate}</span>
              {error_count > 0 && (
                <span className="text-[10px] text-[rgb(var(--warning))]">{error_count} err</span>
              )}
            </div>
          </div>
          <span className="text-[10px] text-[rgb(var(--muted-lighter))]">
            {status === "PROCESSING" ? "Fetching data…" : "Awaiting first scrape"}
          </span>
        </div>
      </div>
    </Link>
  );
}
