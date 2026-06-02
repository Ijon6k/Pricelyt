"use client";

import { useState } from "react";
import PriceChart from "./PriceChart";
import {
  Newspaper,
  ExternalLink,
  Clock,
  TrendingUp,
  List,
} from "lucide-react";

export default function TrackerDashboard({ tracker }) {
  const hasEnoughData = tracker.price_logs && tracker.price_logs.length >= 2;
  const [activeTab, setActiveTab] = useState(hasEnoughData ? "chart" : "table");

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const tabClass = (active, disabled) =>
    [
      "flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors",
      active
        ? "bg-[rgb(var(--accent))] text-white"
        : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]",
      disabled ? "opacity-40 cursor-not-allowed" : "",
    ].join(" ");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      {/* ── MAIN: Chart / History ── */}
      <div className="lg:col-span-3 space-y-5">
        {/* Tab bar */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[rgb(var(--border))]/50 w-fit">
          <button
            onClick={() => setActiveTab("chart")}
            disabled={!hasEnoughData}
            className={tabClass(activeTab === "chart", !hasEnoughData)}
          >
            <TrendingUp size={16} />
            Chart
          </button>
          <button
            onClick={() => setActiveTab("table")}
            className={tabClass(activeTab === "table", false)}
          >
            <List size={16} />
            History
          </button>
        </div>

        {/* Chart / Table */}
        <div className="min-h-[420px] border border-[rgb(var(--border))] rounded-lg overflow-hidden">
          {activeTab === "chart" && (
            <div className="p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-base font-semibold text-[rgb(var(--fg))]">
                  Price trend
                </h3>
                <p className="text-xs text-[rgb(var(--muted))] mt-0.5">
                  Market price over time.
                </p>
              </div>
              <div className="w-full h-[400px]">
                <PriceChart data={tracker.price_logs} />
              </div>
            </div>
          )}

          {activeTab === "table" && (
            <div>
              <div className="px-6 md:px-8 pt-6 pb-4 border-b border-[rgb(var(--border))]">
                <h3 className="text-base font-semibold text-[rgb(var(--fg))]">
                  Price history
                </h3>
                <p className="text-xs text-[rgb(var(--muted))] mt-0.5">
                  {tracker.price_logs?.length || 0} recorded data points.
                </p>
              </div>
              <div className="overflow-x-auto">
                {!tracker.price_logs || tracker.price_logs.length === 0 ? (
                  <div className="p-12 text-center text-xs text-[rgb(var(--muted))]">
                    No price history yet.
                  </div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[rgb(var(--muted))] uppercase tracking-wider border-b border-[rgb(var(--border))]">
                      <tr>
                        <th className="px-6 md:px-8 py-3 font-medium">Date</th>
                        <th className="px-6 py-3 font-medium">Market price</th>
                        <th className="px-6 py-3 font-medium">Samples</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgb(var(--border))]">
                      {[...tracker.price_logs].reverse().map((log) => (
                        <tr
                          key={log.id}
                          className="hover:bg-[rgb(var(--card-hover))] transition-colors"
                        >
                          <td className="px-6 md:px-8 py-3 text-[rgb(var(--muted))]">
                            {formatDate(log.scraped_at)}
                          </td>
                          <td className="px-6 py-3 font-medium tabular-nums text-[rgb(var(--fg))]">
                            {formatCurrency(log.market_price)}
                          </td>
                          <td className="px-6 py-3 text-[rgb(var(--muted))] tabular-nums">
                            {log.sample_count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── NEWS SIDEBAR ── */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 border border-[rgb(var(--border))] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[rgb(var(--border))] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Newspaper size={16} className="text-[rgb(var(--muted))]" />
              <h3 className="text-xs font-semibold text-[rgb(var(--fg))]">
                Related news
              </h3>
            </div>
            <span className="text-xs text-[rgb(var(--muted-lighter))] tabular-nums">
              {tracker.news_logs?.length || 0}
            </span>
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-10rem)] p-3 space-y-2 custom-scrollbar">
            {!tracker.news_logs || tracker.news_logs.length === 0 ? (
              <div className="py-10 text-center text-xs text-[rgb(var(--muted))]">
                No related news found.
              </div>
            ) : (
              tracker.news_logs.map((news) => (
                <a
                  key={news.id}
                  href={news.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block p-3 rounded-md hover:bg-[rgb(var(--accent-subtle))] transition-colors no-underline"
                >
                  <h4 className="font-medium text-sm text-[rgb(var(--fg))] group-hover:text-[rgb(var(--accent))] leading-snug line-clamp-2 transition-colors">
                    {news.title || "Untitled"}
                  </h4>
                  <p className="text-xs text-[rgb(var(--muted))] line-clamp-2 mt-1">
                    {news.content}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[rgb(var(--muted-lighter))] mt-1.5">
                    <span className="flex items-center gap-1 truncate max-w-[100px]">
                      <ExternalLink size={11} />
                      {(() => {
                        try {
                          return new URL(news.source_url).hostname;
                        } catch {
                          return "source";
                        }
                      })()}
                    </span>
                    <span className="ornament-dot" />
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(news.scraped_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
