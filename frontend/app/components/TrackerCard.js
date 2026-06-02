import Link from "next/link";
import {
  Eye,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Clock,
  Minus,
} from "lucide-react";

export default function TrackerCard({ tracker }) {
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

  // Price change: compare latest with second-latest.
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
        return {
          style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          icon: null,
          label: "Ready",
        };
      case "PROCESSING":
        return {
          style: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
          icon: <Loader2 size={10} className="animate-spin mr-1" />,
          label: "Processing",
        };
      case "PENDING":
        return {
          style: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
          icon: <Clock size={10} className="mr-1" />,
          label: "Pending",
        };
      case "ERROR":
        return {
          style: "bg-red-500/10 text-red-600 dark:text-red-400",
          icon: <AlertTriangle size={10} className="mr-1" />,
          label: "Error",
        };
      default:
        return {
          style: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
          icon: null,
          label: s,
        };
    }
  };

  const statusConfig = getStatusConfig(status);

  const formatChange = (val) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      signDisplay: "always",
    }).format(val);

  const formatPct = (val) =>
    `${val >= 0 ? "+" : ""}${val.toFixed(1)}%`;

  return (
    <Link href={`/trackers/${id}`} className="group block h-full no-underline">
      <div className="h-full flex flex-col bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-5 transition-all hover:border-[rgb(var(--accent))]/50 hover:shadow-sm">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[rgb(var(--muted))]">{formattedDate}</span>
            {user_name && (
              <span className="text-[10px] font-medium text-[rgb(var(--accent))]">
                @{user_name}
              </span>
            )}
          </div>
          <span
            className={`flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase ${statusConfig.style}`}
          >
            {statusConfig.icon}
            {statusConfig.label}
          </span>
        </div>

        {/* BODY */}
        <div className="mb-5 flex-grow">
          <h2 className="text-base font-semibold text-[rgb(var(--fg))] leading-snug group-hover:text-[rgb(var(--accent))] transition-colors line-clamp-2">
            {keyword}
          </h2>

          <div className="mt-3">
            {hasPrice ? (
              <div>
                <span className="text-2xl font-semibold text-[rgb(var(--fg))] tracking-tight tabular-nums">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(latestLog.market_price)}
                </span>
                {priceChange !== null && priceChangePct !== null && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {priceChange > 0 ? (
                      <ArrowUpRight size={13} className="text-emerald-500" />
                    ) : priceChange < 0 ? (
                      <ArrowDownRight size={13} className="text-red-500" />
                    ) : (
                      <Minus size={13} className="text-[rgb(var(--muted))]" />
                    )}
                    <span
                      className={`text-xs font-medium tabular-nums ${
                        priceChange > 0
                          ? "text-emerald-500"
                          : priceChange < 0
                            ? "text-red-500"
                            : "text-[rgb(var(--muted))]"
                      }`}
                    >
                      {formatChange(priceChange)} ({formatPct(priceChangePct)})
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs text-[rgb(var(--muted))]">
                {status === "PROCESSING"
                  ? "Fetching data…"
                  : "Awaiting price data"}
              </span>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="pt-4 border-t border-[rgb(var(--border))]">
          <div className="flex items-center justify-between text-xs text-[rgb(var(--muted))]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye size={12} />
                {view_count}
              </span>
              {error_count > 0 && status !== "ERROR" && (
                <span
                  className="flex items-center gap-1 text-amber-600 dark:text-amber-400"
                  title="Previously errored"
                >
                  <AlertTriangle size={12} />
                  {error_count}
                </span>
              )}
            </div>
            <ArrowUpRight
              size={16}
              className="text-[rgb(var(--muted))] group-hover:text-[rgb(var(--accent))] transition-colors"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
