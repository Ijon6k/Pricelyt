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

export default function TrackerRow({ tracker, rank, onWatchlistChange }) {
  const {
    id = "",
    keyword = "Unknown item",
    status = "PENDING",
    created_at,
    view_count = 0,
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
      })
    : "";

  const getStatusDot = (s) => {
    switch (s) {
      case "READY": return "bg-[rgb(var(--success))]";
      case "PROCESSING": return "bg-blue-400 animate-pulse";
      case "PENDING": return "bg-[rgb(var(--warning))]";
      case "ERROR": return "bg-[rgb(var(--danger))]";
      default: return "bg-[rgb(var(--muted-lighter))]";
    }
  };

  const formatPrice = (val) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

  return (
    <Link
      href={`/trackers/${id}`}
      className="group block no-underline border-b border-[rgb(var(--border-soft))] last:border-none"
    >
      <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 px-0 py-3 hover:bg-[rgb(var(--card-hover))] transition-colors">

        {/* Rank */}
        {rank !== undefined && (
          <span className="hidden lg:block text-[11px] text-[rgb(var(--muted-lighter))] tabular-nums w-5 shrink-0 text-right">
            {rank}
          </span>
        )}

        {/* Status dot */}
        <div className="flex items-center justify-center shrink-0 w-4">
          {status === "PROCESSING" ? (
            <Loader2 size={11} className="animate-spin text-blue-400" />
          ) : (
            <span className={`w-[6px] h-[6px] rounded-full ${getStatusDot(status)}`} />
          )}
        </div>

        {/* Product name + source */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-[13px] font-medium text-[rgb(var(--fg))] group-hover:text-[rgb(var(--accent))] transition-colors truncate">
              {keyword}
            </h3>
            {latest_price_source && (
              <SourceBadge source={latest_price_source} />
            )}
          </div>

        </div>

        {/* Sparkline */}
        <div className="hidden md:block w-[72px] shrink-0">
          {hasPrice && price_log_count > 0 ? (
            <Sparkline count={price_log_count} />
          ) : (
            <span className="text-[10px] text-[rgb(var(--muted-lighter))]">&mdash;</span>
          )}
        </div>

        {/* Price — dominant */}
        <div className="w-[90px] sm:w-[120px] shrink-0 text-right">
          {hasPrice ? (
            <div>
              <span className="text-sm sm:text-[15px] font-semibold tabular-nums text-[rgb(var(--fg))]">
                {formatPrice(latest_price)}
              </span>
              {priceChange !== null && priceChangePct !== null && (
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  {priceChange > 0 ? (
                    <ArrowUpRight size={10} className="change-up shrink-0" />
                  ) : priceChange < 0 ? (
                    <ArrowDownRight size={10} className="change-down shrink-0" />
                  ) : (
                    <Minus size={10} className="change-flat shrink-0" />
                  )}
                  <span className={`text-[10px] font-medium tabular-nums ${
                    priceChange > 0 ? "change-up" : priceChange < 0 ? "change-down" : "change-flat"
                  }`}>
                    {priceChange > 0 ? "+" : ""}{priceChangePct.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-[rgb(var(--muted-lighter))]">
              {status === "PROCESSING" ? "Fetching…" : "—"}
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="hidden xl:flex items-center gap-3 w-[100px] shrink-0 text-right">
          <div className="flex items-center gap-1 text-[11px] text-[rgb(var(--muted-lighter))]">
            <Eye size={12} />
            {view_count}
          </div>
          <span className="text-[11px] text-[rgb(var(--muted-lighter))]">{formattedDate}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <LoveButton trackerId={id} size={14} onWatchlistChange={onWatchlistChange} />
          <ArrowUpRight
            size={14}
            className="text-[rgb(var(--muted-lighter))] group-hover:text-[rgb(var(--accent))] transition-colors"
          />
        </div>
      </div>
    </Link>
  );
}
