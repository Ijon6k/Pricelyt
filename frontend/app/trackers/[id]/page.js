import Link from "next/link";
import { fetchTrackerDetail } from "@/app/lib/api";
import TrackerDashboard from "@/app/components/TrackerDashboard";
import DealScore from "@/app/components/DealScore";
import SourceBadge from "@/app/components/SourceBadge";
import { ArrowLeft, Eye, Calendar } from "lucide-react";
import AutoRefresh from "@/app/components/AutoRefresh";
import DeleteTrackerButton from "@/app/components/DeleteTrackerButton";
import ShareButton from "@/app/components/ShareButton";

function Stat({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="editorial-label">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-[rgb(var(--fg))] mt-1">
        {value}
      </span>
    </div>
  );
}

const formatCurrency = (val) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(val);

const formatDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

function StatusBadge({ status }) {
  const styles = {
    READY: "bg-[rgb(var(--success))]",
    PROCESSING: "bg-blue-500",
    PENDING: "bg-[rgb(var(--amber))]",
    ERROR: "bg-[rgb(var(--danger))]",
  };
  const labels = {
    READY: "Ready",
    PROCESSING: "Processing",
    PENDING: "Pending",
    ERROR: "Error",
  };
  return (
    <div className="flex items-center gap-2.5">
      <span className={`w-2.5 h-2.5 rounded-full ${styles[status] || "bg-[rgb(var(--muted))]"}`} />
      <span className="text-sm font-medium uppercase tracking-wider text-[rgb(var(--muted))]">
        {labels[status] || status}
      </span>
    </div>
  );
}

export default async function TrackerDetailPage({ params }) {
  const { id } = await params;
  const tracker = await fetchTrackerDetail(id);

  const hasError = !!tracker.last_error_code;

  const latestLog =
    tracker.price_logs && tracker.price_logs.length > 0
      ? tracker.price_logs[tracker.price_logs.length - 1]
      : null;
  const prevLog =
    tracker.price_logs && tracker.price_logs.length > 1
      ? tracker.price_logs[tracker.price_logs.length - 2]
      : null;
  const priceChange = latestLog && prevLog
    ? latestLog.market_price - prevLog.market_price
    : null;
  const priceChangePct = prevLog && prevLog.market_price > 0
    ? ((priceChange) / prevLog.market_price) * 100
    : null;

  const dataPoints = tracker.price_logs?.length || 0;

  return (
    <main className="min-h-screen">
      <AutoRefresh status={tracker.status} />

      {/* Decorative top stripe */}
      <div className="h-1 bg-gradient-to-r from-[rgb(var(--accent))]/30 via-[rgb(var(--accent))]/10 to-transparent" />

      <div className="max-w-screen-2xl mx-auto px-6 xl:px-10 py-8">

        {/* BACK + ACTIONS */}
        <div className="flex items-center justify-between mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors no-underline"
          >
            <ArrowLeft size={16} /> Back to overview
          </Link>
          <div className="flex items-center gap-3">
            <ShareButton trackerId={tracker.id} />
            <DeleteTrackerButton id={tracker.id} />
          </div>
        </div>

        {/* HEADER — now 2-column on desktop */}
        <div className="mb-10 pb-10 border-b border-[rgb(var(--border))]">
          {/* Meta row */}
          <div className="flex items-center gap-5 mb-6">
            <StatusBadge status={tracker.status} />
            {latestLog?.source && <SourceBadge source={latestLog.source} />}
            {dataPoints > 0 && (
              <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  <span>{formatDate(tracker.created_at)}</span>
                </div>
                <span className="ornament-dot" />
                <div className="flex items-center gap-1.5">
                  <Eye size={14} />
                  <span>{tracker.view_count} views</span>
                </div>
                <span className="ornament-dot" />
                <span>{dataPoints} data points</span>
              </div>
            )}
          </div>

          {/* Two-col layout: product name + price side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-end">
            {/* Left: product name + meta */}
            <div className="lg:col-span-3">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1] mb-3 capitalize">
                {tracker.keyword}
              </h1>
              <DealScore priceLogs={tracker.price_logs} />
            </div>

            {/* Right: dominant price + change */}
            <div className="lg:col-span-2 text-left lg:text-right">
              {latestLog && (
                <div className="flex lg:flex-col items-baseline lg:items-end gap-4 lg:gap-1">
                  <span className="text-5xl md:text-6xl font-bold tabular-nums text-[rgb(var(--fg))] leading-none">
                    {formatCurrency(latestLog.market_price)}
                  </span>
                  <div className="flex lg:flex-col items-baseline lg:items-end gap-2 lg:gap-0.5">
                    {priceChange !== null && priceChangePct !== null && (
                      <span
                        className={`text-base font-semibold tabular-nums ${
                          priceChange > 0
                            ? "text-emerald-500"
                            : priceChange < 0
                              ? "text-red-500"
                              : "text-[rgb(var(--muted))]"
                        }`}
                      >
                        {priceChange > 0 ? "↑" : priceChange < 0 ? "↓" : "—"}
                        {" "}
                        {priceChange > 0 ? "+" : ""}
                        {formatCurrency(priceChange)}
                        {" "}({priceChangePct.toFixed(1)}%)
                      </span>
                    )}
                    <span className="text-xs text-[rgb(var(--muted-lighter))]">
                      Latest price
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SUMMARY STATS */}
          {tracker.price_logs && tracker.price_logs.length >= 2 && (
            <>
              <div className="ornament-divider mt-8 mb-6">
                <span className="text-sm font-medium text-[rgb(var(--muted))]">Price statistics</span>
              </div>
              <div className="flex items-center gap-10 flex-wrap">
                {(() => {
                  const prices = tracker.price_logs.map((l) => l.market_price);
                  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
                  const min = Math.min(...prices);
                  const max = Math.max(...prices);
                  const variance = prices.reduce((s, p) => s + (p - avg) ** 2, 0) / prices.length;
                  const stddev = Math.sqrt(variance);
                  const volatility = avg > 0 ? (stddev / avg) * 100 : 0;

                  return (
                    <>
                      <Stat label="Average" value={formatCurrency(avg)} />
                      <Stat label="Min" value={formatCurrency(min)} />
                      <Stat label="Max" value={formatCurrency(max)} />
                      <Stat label="Volatility" value={`${volatility.toFixed(1)}%`} />
                      <Stat label="Data points" value={String(tracker.price_logs.length)} />
                    </>
                  );
                })()}
              </div>
            </>
          )}
        </div>

        {/* ERROR BANNER */}
        {hasError && (
          <div className="mb-8 p-5 rounded-lg border border-[rgb(var(--danger))]/20 bg-[rgb(var(--danger))]/5 flex gap-3 items-start">
            <div className="w-2.5 h-2.5 rounded-full bg-[rgb(var(--danger))] mt-1 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-[rgb(var(--danger))]">
                Scraping error
              </h3>
              <p className="text-sm text-[rgb(var(--muted))] mt-1">
                {tracker.last_error_message} (code: {tracker.last_error_code})
              </p>
            </div>
          </div>
        )}

        {/* DASHBOARD */}
        <TrackerDashboard tracker={tracker} />
      </div>
    </main>
  );
}
