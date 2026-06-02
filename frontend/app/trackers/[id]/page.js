import Link from "next/link";
import { fetchTrackerDetail } from "@/app/lib/api";
import TrackerDashboard from "@/app/components/TrackerDashboard";
import DealScore from "@/app/components/DealScore";
import PriceTrend from "@/app/components/PriceTrend";
import DeleteTrackerButton from "@/app/components/DeleteTrackerButton";
import AutoRefresh from "@/app/components/AutoRefresh";
import {
  ArrowLeft,
  AlertTriangle,
  Eye,
  Calendar,
  TrendingUp,
  TrendingDown,
  Tag,
} from "lucide-react";

export default async function TrackerDetailPage({ params }) {
  const { id } = await params;
  const tracker = await fetchTrackerDetail(id);

  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("en-US", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "-";

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

  const getStatusBadge = (status) => {
    const styles = {
      READY: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      PROCESSING: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      PENDING: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      ERROR: "bg-red-500/10 text-red-600 dark:text-red-400",
    };
    return styles[status] || styles.PENDING;
  };

  return (
    <main className="min-h-screen py-8 px-4 md:px-6">
      <AutoRefresh status={tracker.status} />
      <div className="mx-auto max-w-6xl space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="w-fit inline-flex items-center gap-1.5 text-sm font-medium text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors no-underline"
            >
              <ArrowLeft size={15} /> Back
            </Link>
            <DeleteTrackerButton id={tracker.id} />
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-5 pb-6 border-b border-[rgb(var(--border))]">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase ${getStatusBadge(tracker.status)}`}
                >
                  {tracker.status}
                </span>
                {tracker.price_logs?.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase bg-zinc-500/10 text-zinc-600 dark:text-zinc-400">
                    {tracker.price_logs.length} data points
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold text-[rgb(var(--fg))] tracking-tight capitalize">
                {tracker.keyword}
              </h1>
            </div>

            <div className="flex items-center gap-6 text-[rgb(var(--fg))]">
              {/* CURRENT PRICE CARD */}
              {latestLog && (
                <div className="flex flex-col bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg px-4 py-2.5 min-w-[160px]">
                  <span className="text-[11px] font-medium text-[rgb(var(--muted))] uppercase tracking-wider mb-1">
                    Current price
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold tabular-nums">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(latestLog.market_price)}
                    </span>
                    {priceChange !== null && priceChange !== 0 && (
                      priceChange > 0 ? (
                        <TrendingUp size={16} className="text-emerald-500" />
                      ) : (
                        <TrendingDown size={16} className="text-red-500" />
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-[rgb(var(--muted))] uppercase tracking-wider mb-1">
                  Views
                </span>
                <div className="flex items-center gap-1.5 text-base font-semibold">
                  <Eye size={15} className="text-[rgb(var(--muted))]" />
                  {tracker.view_count}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-[rgb(var(--muted))] uppercase tracking-wider mb-1">
                  Created
                </span>
                <div className="flex items-center gap-1.5 text-base font-medium">
                  <Calendar size={15} className="text-[rgb(var(--muted))]" />
                  {formatDate(tracker.created_at)}
                </div>
              </div>
            </div>

            {/* DEAL SCORE + TREND */}
            <div className="flex items-center gap-3 mt-2">
              <DealScore priceLogs={tracker.price_logs} />
              <PriceTrend priceLogs={tracker.price_logs} />
            </div>
          </div>
        </div>

        {/* ERROR BANNER */}
        {hasError && (
          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex gap-3 items-start">
            <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-600 dark:text-red-400">
                Scraping error
              </h3>
              <p className="text-xs text-[rgb(var(--muted))] mt-0.5">
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
