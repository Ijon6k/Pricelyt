import { fetchSharedTracker } from "@/app/lib/api";
import PriceChart from "@/app/components/PriceChart";
import SourceBadge from "@/app/components/SourceBadge";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

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

export default async function SharedTrackerPage({ params }) {
  const { token } = await params;
  let tracker;
  let error = null;

  try {
    tracker = await fetchSharedTracker(token);
  } catch (err) {
    error = "This share link is invalid or has been removed.";
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[rgb(var(--danger))]/10 flex items-center justify-center">
            <ExternalLink size={28} className="text-[rgb(var(--danger))]" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight mb-2">Link not found</h2>
          <p className="text-sm text-[rgb(var(--muted))] mb-6">{error}</p>
          <Link
            href="/"
            className="text-sm text-[rgb(var(--accent))] hover:underline"
          >
            ← Back to Pricelyt
          </Link>
        </div>
      </main>
    );
  }

  const latestLog =
    tracker.price_logs && tracker.price_logs.length > 0
      ? tracker.price_logs[tracker.price_logs.length - 1]
      : null;
  const prevLog =
    tracker.price_logs && tracker.price_logs.length > 1
      ? tracker.price_logs[tracker.price_logs.length - 2]
      : null;
  const priceChange =
    latestLog && prevLog ? latestLog.market_price - prevLog.market_price : null;
  const priceChangePct =
    prevLog && prevLog.market_price > 0
      ? (priceChange / prevLog.market_price) * 100
      : null;

  return (
    <main className="min-h-screen">
      <div className="h-1 bg-gradient-to-r from-[rgb(var(--accent))]/30 via-[rgb(var(--accent))]/10 to-transparent" />

      <div className="max-w-screen-2xl mx-auto px-6 xl:px-10 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors no-underline"
          >
            <ArrowLeft size={16} /> Back to Pricelyt
          </Link>
          <span className="text-xs text-[rgb(var(--muted-lighter))]">Shared view</span>
        </div>

        {/* Product info */}
        <div className="mb-10 pb-10 border-b border-[rgb(var(--border))]">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-end">
            <div className="lg:col-span-3">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1] mb-3 capitalize">
                {tracker.keyword}
              </h1>
              <div className="flex items-center gap-4 text-sm text-[rgb(var(--muted))]">
                {latestLog?.source && <SourceBadge source={latestLog.source} />}
                <span>{formatDate(tracker.created_at)}</span>
                <span className="ornament-dot" />
                <span>{tracker.price_logs?.length || 0} data points</span>
              </div>
            </div>

            <div className="lg:col-span-2 text-left lg:text-right">
              {latestLog && (
                <div className="flex lg:flex-col items-baseline lg:items-end gap-4 lg:gap-1">
                  <span className="text-5xl md:text-6xl font-bold tabular-nums text-[rgb(var(--fg))] leading-none">
                    {formatCurrency(latestLog.market_price)}
                  </span>
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
                      {priceChange > 0 ? "↑" : priceChange < 0 ? "↓" : "—"}{" "}
                      {priceChange > 0 ? "+" : ""}
                      {formatCurrency(priceChange)} ({priceChangePct.toFixed(1)}
                      %)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Summary stats */}
          {tracker.price_logs && tracker.price_logs.length >= 2 && (
            <>
              <div className="ornament-divider mt-8 mb-6">
                <span className="text-sm font-medium text-[rgb(var(--muted))]">
                  Price statistics
                </span>
              </div>
              <div className="flex items-center gap-10 flex-wrap">
                {(() => {
                  const prices = tracker.price_logs.map((l) => l.market_price);
                  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
                  const min = Math.min(...prices);
                  const max = Math.max(...prices);
                  const variance =
                    prices.reduce((s, p) => s + (p - avg) ** 2, 0) /
                    prices.length;
                  const stddev = Math.sqrt(variance);
                  const volatility = avg > 0 ? (stddev / avg) * 100 : 0;

                  return (
                    <>
                      <Stat label="Average" value={formatCurrency(avg)} />
                      <Stat label="Min" value={formatCurrency(min)} />
                      <Stat label="Max" value={formatCurrency(max)} />
                      <Stat
                        label="Volatility"
                        value={`${volatility.toFixed(1)}%`}
                      />
                    </>
                  );
                })()}
              </div>
            </>
          )}
        </div>

        {/* Chart */}
        {tracker.price_logs && tracker.price_logs.length > 0 && (
          <div className="mb-10">
            <PriceChart priceLogs={tracker.price_logs} />
          </div>
        )}

        {/* Price history table */}
        {tracker.price_logs && tracker.price_logs.length > 0 && (
          <div className="mb-10">
            <div className="ornament-divider mb-6">
              <span className="text-sm font-medium text-[rgb(var(--muted))]">
                Price history
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgb(var(--border))]">
                    <th className="text-left py-2 pr-4 editorial-label">Date</th>
                    <th className="text-right py-2 px-4 editorial-label">Price</th>
                    <th className="text-left py-2 px-4 editorial-label">Source</th>
                    <th className="text-right py-2 pl-4 editorial-label">Samples</th>
                  </tr>
                </thead>
                <tbody>
                  {tracker.price_logs
                    .slice()
                    .reverse()
                    .slice(0, 50)
                    .map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-[rgb(var(--border))]/50 hover:bg-[rgb(var(--card-hover))]"
                      >
                        <td className="py-2 pr-4 text-[rgb(var(--muted))]">
                          {formatDate(log.scraped_at)}
                        </td>
                        <td className="py-2 px-4 text-right font-semibold tabular-nums">
                          {formatCurrency(log.market_price)}
                        </td>
                        <td className="py-2 px-4">
                          <SourceBadge source={log.source} />
                        </td>
                        <td className="py-2 pl-4 text-right text-[rgb(var(--muted))] tabular-nums">
                          {log.sample_count}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8 border-t border-[rgb(var(--border))]">
          <p className="text-xs text-[rgb(var(--muted-lighter))]">
            Tracked by{" "}
            <Link
              href="/"
              className="text-[rgb(var(--accent))] hover:underline"
            >
              Pricelyt
            </Link>{" "}
            — Price intelligence platform
          </p>
        </div>
      </div>
    </main>
  );
}

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
