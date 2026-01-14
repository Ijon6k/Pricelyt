"use client";

import { useState } from "react";
import PriceChart from "./PriceChart";
import {
  TrendingUp,
  List,
  ExternalLink,
  AlertCircle,
  Clock,
  Newspaper,
} from "lucide-react";

export default function TrackerDashboard({ tracker }) {
  // Logic: Default ke 'table' jika data < 7, jika tidak 'chart'
  const hasEnoughData = tracker.price_logs && tracker.price_logs.length >= 7;
  const [activeTab, setActiveTab] = useState(hasEnoughData ? "chart" : "table");

  // Formatters
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* --- LEFT COLUMN: MAIN CONTENT (Chart/Table) --- */}
      <div className="lg:col-span-2 space-y-6">
        {/* NAV TABS */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] w-fit shadow-sm">
          <button
            onClick={() => setActiveTab("chart")}
            disabled={!hasEnoughData}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300
              ${
                activeTab === "chart"
                  ? "bg-[rgb(var(--accent))] text-white shadow-md"
                  : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg))]"
              }
              ${!hasEnoughData ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <TrendingUp size={16} />
            Chart Analysis
          </button>
          <button
            onClick={() => setActiveTab("table")}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300
              ${
                activeTab === "table"
                  ? "bg-[rgb(var(--accent))] text-white shadow-md"
                  : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg))]"
              }
            `}
          >
            <List size={16} />
            History Logs
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl shadow-sm overflow-hidden min-h-[450px]">
          {/* VIEW: CHART */}
          {activeTab === "chart" && (
            <div className="p-6 h-full flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-[rgb(var(--fg))]">
                  Price Trend
                </h3>
                <p className="text-sm text-[rgb(var(--muted))]">
                  Visualizing market price changes over time.
                </p>
              </div>
              <div className="flex-grow">
                <PriceChart data={tracker.price_logs} />
              </div>
            </div>
          )}

          {/* VIEW: TABLE */}
          {activeTab === "table" && (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-[rgb(var(--border))]">
                <h3 className="text-lg font-bold text-[rgb(var(--fg))]">
                  Detailed Logs
                </h3>
                <p className="text-sm text-[rgb(var(--muted))]">
                  Showing {tracker.price_logs?.length || 0} recorded data
                  points.
                </p>
              </div>
              <div className="overflow-x-auto">
                {!tracker.price_logs || tracker.price_logs.length === 0 ? (
                  <div className="p-10 text-center text-[rgb(var(--muted))] italic">
                    No price history data available yet.
                  </div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[rgb(var(--bg))]/50 text-[rgb(var(--muted))] font-semibold uppercase text-xs tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Date Scraped</th>
                        <th className="px-6 py-4">Market Price</th>
                        <th className="px-6 py-4">Samples</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgb(var(--border))]">
                      {[...tracker.price_logs].reverse().map((log) => (
                        <tr
                          key={log.id}
                          className="hover:bg-[rgb(var(--bg))]/30 transition-colors"
                        >
                          <td className="px-6 py-4 text-[rgb(var(--fg))] font-medium">
                            {formatDate(log.scraped_at)}
                          </td>
                          <td className="px-6 py-4 text-[rgb(var(--fg))]">
                            {formatCurrency(log.market_price)}
                          </td>
                          <td className="px-6 py-4 text-[rgb(var(--muted))]">
                            {log.sample_count} items
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

      {/* --- RIGHT COLUMN: NEWS FEED (SCROLLABLE) --- */}
      <div className="lg:col-span-1 h-full">
        <div className="sticky top-4 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl shadow-sm flex flex-col max-h-[calc(100vh-2rem)]">
          {/* News Header */}
          <div className="p-5 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] z-10 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Newspaper size={18} className="text-[rgb(var(--accent))]" />
              <h3 className="font-bold text-[rgb(var(--fg))]">Latest News</h3>
            </div>
            <span className="text-xs bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent))] px-2 py-1 rounded-full font-bold">
              {tracker.news_logs?.length || 0}
            </span>
          </div>

          {/* Scrollable List */}
          <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {!tracker.news_logs || tracker.news_logs.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-[rgb(var(--border))] rounded-xl">
                <p className="text-[rgb(var(--muted))] text-sm">
                  No related news found.
                </p>
              </div>
            ) : (
              tracker.news_logs.map((news) => (
                <a
                  key={news.id}
                  href={news.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block p-4 rounded-xl bg-[rgb(var(--bg))]/30 border border-[rgb(var(--border))] hover:border-[rgb(var(--accent))] hover:bg-[rgb(var(--card))] transition-all duration-200"
                >
                  <div className="flex flex-col gap-2">
                    {news.is_blocked && (
                      <span className="w-fit flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded uppercase">
                        <AlertCircle size={10} /> Blocked
                      </span>
                    )}
                    <h4 className="font-bold text-sm text-[rgb(var(--fg))] group-hover:text-[rgb(var(--accent))] leading-snug line-clamp-2">
                      {news.title || "No Title Available"}
                    </h4>
                    <p className="text-xs text-[rgb(var(--muted))] line-clamp-2">
                      {news.content}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-[rgb(var(--muted))] mt-1">
                      <span className="flex items-center gap-1 truncate max-w-[100px]">
                        <ExternalLink size={10} />
                        {new URL(news.source_url).hostname}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(news.scraped_at).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" },
                        )}
                      </span>
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>

          {/* Fade Effect at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[rgb(var(--card))] to-transparent pointer-events-none rounded-b-2xl"></div>
        </div>
      </div>
    </div>
  );
}
