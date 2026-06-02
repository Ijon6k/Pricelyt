import Link from "next/link";
import Sparkline from "./Sparkline";
import SourceBadge from "./SourceBadge";
import {
  Eye,
  AlertTriangle,
  Loader2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

/**
 * Table-row variant of tracker display for the tracked list view.
 * Cleaner, information-dense, with sparkline preview.
 */
export default function TrackerRow({ tracker, rank }) {
  const {
    id = "",
    keyword = "Unknown item",
    status = "PENDING",
    created_at,
    view_count = 0,
    error_count = 0,
    user_name,
    price_logs = [],
  } = tracker || {};

  const latestLog =
    price_logs.length > 0 ? price_logs[price_logs.length - 1] : null;
  const hasPrice = !!latestLog;

  const prevLog = price_logs.length > 1 ? price_logs[price_logs.length - 2] : null;
  const priceChange = hasPrice && prevLog
    ? latestLog.market_price - prevLog.market_price
    : null;
  const priceChangePct = hasPrice && prevLog && prevLog.market_price > 0
    ? ((latestLog.market_price - prevLog.market_price) / prevLog.market_price) * 100
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

  const prices = price_logs.map((l) => l.market_price);

  return (
    <Link
      href={`/trackers/${id}`}
      className="group block no-underline border-b border-[rgb(var(--border))] last:border-none"
    >
      <div className="flex items-center gap-4 md:gap-6 px-2 py-4 hover:bg-[rgb(var(--card-hover))] transition-colors rounded-sm">
        {/* Rank (optional, numbered) */}
        {rank !== undefined && (
          <span className="text-xs text-[rgb(var(--muted-lighter))] tabular-nums w-5 shrink-0 text-right">
            {rank}
          </span>
        )}

        {/* Status dot + label */}
        <div className="flex items-center gap-2 w-[90px] shrink-0">
          {statusCfg.spin ? (
            <Loader2 size={10} className="animate-spin text-blue-500 shrink-0" />
          ) : (
            <span className={`w-2 h-2 rounded-full shrink-0 ${statusCfg.dot}`} />
          )}
          <span className="text-xs text-[rgb(var(--muted))]">{statusCfg.label}</span>
        </div>

        {/* Keyword */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-[rgb(var(--fg))] group-hover:text-[rgb(var(--accent))] transition-colors truncate">
              {keyword}
            </h3>
            {user_name && (
              <span className="text-[10px] text-[rgb(var(--accent))] font-medium shrink-0">
                @{user_name}
              </span>
            )}
            {latestLog?.source && (
              <SourceBadge source={latestLog.source} />
            )}
          </div>
        </div>

        {/* Sparkline */}
        <div className="hidden md:block w-[80px] shrink-0">
          {hasPrice ? (
            <Sparkline prices={prices} />
          ) : (
            <span className="text-xs text-[rgb(var(--muted-lighter))]">—</span>
          )}
        </div>

        {/* Price + change */}
        <div className="w-[130px] shrink-0 text-right">
          {hasPrice ? (
            <div>
              <span className="text-sm font-semibold tabular-nums text-[rgb(var(--fg))]">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(latestLog.market_price)}
              </span>
              {priceChange !== null && priceChangePct !== null && (
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  {priceChange > 0 ? (
                    <ArrowUpRight size={10} className="text-emerald-500 shrink-0" />
                  ) : priceChange < 0 ? (
                    <ArrowDownRight size={10} className="text-red-500 shrink-0" />
                  ) : (
                    <Minus size={10} className="text-[rgb(var(--muted))] shrink-0" />
                  )}
                  <span
                    className={`text-[11px] font-medium tabular-nums ${
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
            <Eye size={11} />
            {view_count}
          </div>
          <span className="text-xs text-[rgb(var(--muted-lighter))]">{formattedDate}</span>
        </div>

        {/* Arrow indicator */}
        <div className="w-4 shrink-0">
          <ArrowUpRight
            size={14}
            className="text-[rgb(var(--muted-lighter))] group-hover:text-[rgb(var(--accent))] transition-colors"
          />
        </div>
      </div>
    </Link>
  );
}
