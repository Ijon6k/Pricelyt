import Link from "next/link";
import Sparkline from "./Sparkline";
import SourceBadge from "./SourceBadge";
import {
  Eye,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import LoveButton from "./LoveButton";

export default function TrackerRow({ tracker, rank }) {
  const {
    id = "",
    keyword = "Unknown item",
    status = "PENDING",
    created_at,
    view_count = 0,
    user_name,
    latest_price,
    previous_price,
    latest_price_source,
    price_log_count = 0,
  } = tracker || {};

  const hasPrice = latest_price != null;
  const priceChange = hasPrice && previous_price != null
    ? latest_price - previous_price
    : null;
  const priceChangePct = hasPrice && previous_price != null && previous_price > 0
    ? ((latest_price - previous_price) / previous_price) * 100
    : null;

  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

  const getStatusConfig = (s) => {
    switch (s) {
      case "READY":
        return { dot: "bg-[rgb(var(--success))]", label: "Ready" };
      case "PROCESSING":
        return { dot: "bg-blue-500", label: "Processing", spin: true };
      case "PENDING":
        return { dot: "bg-[rgb(var(--amber))]", label: "Pending" };
      case "ERROR":
        return { dot: "bg-[rgb(var(--danger))]", label: "Error" };
      default:
        return { dot: "bg-[rgb(var(--muted))]", label: s };
    }
  };

  const statusCfg = getStatusConfig(status);

  return (
    <Link
      href={`/trackers/${id}`}
      className="group block no-underline border-b border-[rgb(var(--border))] last:border-none"
    >
      <div className="flex items-center gap-1.5 sm:gap-4 md:gap-6 px-2 py-4 hover:bg-[rgb(var(--card-hover))] transition-colors rounded-sm">

        {rank !== undefined && (
          <span className="hidden sm:block text-xs text-[rgb(var(--muted-lighter))] tabular-nums w-5 shrink-0 text-right">
            {rank}
          </span>
        )}

        {/* Status — icon only on mobile */}
        <div className="flex items-center justify-center shrink-0 w-5 sm:w-[90px] sm:justify-start">
          {statusCfg.spin ? (
            <Loader2 size={12} className="animate-spin text-blue-500 shrink-0" />
          ) : (
            <span className={`w-2 h-2 rounded-full shrink-0 ${statusCfg.dot}`} />
          )}
          <span className="hidden sm:inline text-xs text-[rgb(var(--muted))] ml-2">{statusCfg.label}</span>
        </div>

        {/* Keyword */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-[rgb(var(--fg))] group-hover:text-[rgb(var(--accent))] transition-colors truncate">
              {keyword}
            </h3>
            {user_name && (
              <span className="text-xs text-[rgb(var(--accent))] font-medium shrink-0">
                @{user_name}
              </span>
            )}
            {latest_price_source && (
              <SourceBadge source={latest_price_source} />
            )}
          </div>
        </div>

        {/* Sparkline */}
        <div className="hidden md:block w-[80px] shrink-0">
          {hasPrice ? (
            <Sparkline count={price_log_count} />
          ) : (
            <span className="text-xs text-[rgb(var(--muted-lighter))]">—</span>
          )}
        </div>

        {/* Price */}
        <div className="w-[85px] sm:w-[130px] shrink-0 text-right">
          {hasPrice ? (
            <div>
              <span className="text-xs sm:text-sm font-semibold tabular-nums text-[rgb(var(--fg))]">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(latest_price)}
              </span>
              {priceChange !== null && priceChangePct !== null && (
                <div className="flex items-center justify-end gap-0.5 mt-0.5">
                  {priceChange > 0 ? (
                    <ArrowUpRight size={10} className="text-emerald-500 shrink-0" />
                  ) : priceChange < 0 ? (
                    <ArrowDownRight size={10} className="text-red-500 shrink-0" />
                  ) : (
                    <Minus size={10} className="text-[rgb(var(--muted))] shrink-0" />
                  )}
                  <span
                    className={`text-[10px] sm:text-xs font-medium tabular-nums ${
                      priceChange > 0
                        ? "text-emerald-500"
                        : priceChange < 0
                          ? "text-red-500"
                          : "text-[rgb(var(--muted))]"
                    }`}
                  >
                    {priceChange > 0 ? "+" : ""}
                    {priceChangePct.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-xs text-[rgb(var(--muted-lighter))]">
              {status === "PROCESSING" ? "Fetching…" : "Awaiting data"}
            </span>
          )}
        </div>

        {/* Date + Views */}
        <div className="hidden lg:flex items-center gap-4 w-[120px] shrink-0 text-right">
          <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted-lighter))]">
            <Eye size={13} />
            {view_count}
          </div>
          <span className="text-xs text-[rgb(var(--muted-lighter))]">{formattedDate}</span>
        </div>

        {/* Arrow */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <LoveButton trackerId={id} size={14} />
          <ArrowUpRight
            size={14}
            className="text-[rgb(var(--muted-lighter))] group-hover:text-[rgb(var(--accent))] transition-colors"
          />
        </div>
      </div>
    </Link>
  );
}
