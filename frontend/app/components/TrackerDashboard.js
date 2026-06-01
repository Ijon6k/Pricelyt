"use client";

import { useState } from "react";
import PriceChart from "./PriceChart";
import {
  TrendingUp,
  List,
  ExternalLink,
  Clock,
  Newspaper,
} from "lucide-react";

export default function TrackerDashboard({ tracker }) {
  // Show the chart as soon as there are at least 2 points to connect; fall
  // back to the table view below that.
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
      "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
      active
        ? "bg-[rgb(var(--accent))] text-white"
        : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]",
      disabled ? "opacity-40 cursor-not-allowed" : "",
    ].join(" ");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* LEFT: chart / table */}
      <div className="lg:col-span-2 space-y-5">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[rgb(var(--card))] border border-[rgb(var(--border))] w-fit">
          <button
            onClick={() => setActiveTab("chart")}
            disabled={!hasEnoughData}
            className={tabClass(activeTab === "chart", !hasEnoughData)}
          >
            <TrendingUp size={15} />
            Chart
          </button>
          <button
            onClick={() => setActiveTab("table")}
            className={tabClass(activeTab === "table", false)}
          >
            <List size={15} />
            History
          </button>
        </div>

        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl overflow-hidden min-h-[420px]">
          {activeTab === "chart" && (
            <div className="p-6 h-full flex flex-col">
              <div className="mb-5">
                <h3 className="text-base font-semibold text-[rgb(var(--fg))]">
                  Price trend
                </h3>
                <p className="text-sm text-[rgb(var(--muted))]">
                  Market price over time.
                </p>
              </div>
              <div className="flex-grow">
                <PriceChart data={tracker.price_logs} />
              </div>
            </div>
          )}

          {activeTab === "table" && (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-[rgb(var(--border))]">
                <h3 className="text-base font-semibold text-[rgb(var(--fg))]">
                  History
                </h3>
                <p className="text-sm text-[rgb(var(--muted))]">
                  {tracker.price_logs?.length || 0} recorded data points.
                </p>
              </div>
              <div className="overflow-x-auto">
                {!tracker.price_logs || tracker.price_logs.length === 0 ? (
                  <div className="p-10 text-center text-sm text-[rgb(var(--muted))]">
                    No price history yet.
                  </div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="text-[rgb(var(--muted))] text-xs uppercase tracking-wider border-b border-[rgb(var(--border))]">
                      <tr>
                        <th className="px-6 py-3 font-medium">Date</th>
                        <th className="px-6 py-3 font-medium">Market price</th>
                        <th className="px-6 py-3 font-medium">Samples</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgb(var(--border))]">
                      {[...tracker.price_logs].reverse().map((log) => (
                        <tr
                          key={log.id}
                          className="hover:bg-[rgb(var(--bg))] transition-colors"
                        >
                          <td className="px-6 py-3 text-[rgb(var(--muted))]">
                            {formatDate(log.scraped_at)}
                          </td>
                          <td className="px-6 py-3 font-medium text-[rgb(var(--fg))] tabular-nums">
                            {formatCurrency(log.market_price)}
                          </td>
                          <td className="px-6 py-3 text-[rgb(var(--muted))]">
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

      {/* RIGHT: news */}
      <div className="lg:col-span-1">
        <div className="sticky top-20 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl flex flex-col max-h-[calc(100vh-6rem)]">
          <div className="p-4 border-b border-[rgb(var(--border))] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Newspaper size={16} className="text-[rgb(var(--muted))]" />
              <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">
                Related news
              </h3>
            </div>
            <span className="text-xs text-[rgb(var(--muted))]">
              {tracker.news_logs?.length || 0}
            </span>
          </div>

          <div className="overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {!tracker.news_logs || tracker.news_logs.length === 0 ? (
              <div className="py-10 text-center text-sm text-[rgb(var(--muted))]">
                No related news found.
              </div>
            ) : (
              tracker.news_logs.map((news) => (
                <a
                  key={news.id}
                  href={news.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block p-3 rounded-lg border border-[rgb(var(--border))] hover:border-[rgb(var(--accent))] transition-colors no-underline"
                >
                  <h4 className="font-medium text-sm text-[rgb(var(--fg))] group-hover:text-[rgb(var(--accent))] leading-snug line-clamp-2 transition-colors">
                    {news.title || "Untitled"}
                  </h4>
                  <p className="text-xs text-[rgb(var(--muted))] line-clamp-2 mt-1">
                    {news.content}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-[rgb(var(--muted))] mt-2">
                    <span className="flex items-center gap-1 truncate max-w-[120px]">
                      <ExternalLink size={11} />
                      {(() => {
                        try {
                          return new URL(news.source_url).hostname;
                        } catch {
                          return "source";
                        }
                      })()}
                    </span>
                    <span>·</span>
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
