"use client";

import { useState, useMemo } from "react";
import PriceChart from "@/app/components/PriceChart";
import TimeframeSelector from "@/app/components/TimeframeSelector";

export default function TimeframeSection({
  priceLogs,
  formatCurrency,
  formatDate,
}) {
  const [timeframe, setTimeframe] = useState("7d");

  const options = [
    { key: "7d", label: "7 Days", min: 7 },
    { key: "1m", label: "1 Month", min: 30 },
    { key: "1y", label: "1 Year", min: 365 },
  ].filter((opt) => priceLogs.length >= opt.min);

  const filteredLogs = useMemo(() => {
    if (timeframe === "7d") return priceLogs.slice(-7);
    if (timeframe === "1m") return priceLogs.slice(-30);
    if (timeframe === "1y") return priceLogs.slice(-365);
    return priceLogs;
  }, [timeframe, priceLogs]);

  const chartData = filteredLogs.map((log) => ({
    date: new Date(log.scraped_at).toLocaleDateString("en-US"),
    price: log.market_price,
  }));

  return (
    <div
      className="
      bg-[rgb(var(--card))]
      border border-[rgb(var(--border))]
      rounded-2xl shadow-sm
      p-8
    "
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Price History</h2>

        {options.length > 0 && (
          <TimeframeSelector
            options={options}
            active={timeframe}
            onChange={setTimeframe}
          />
        )}
      </div>

      {priceLogs.length >= 7 ? (
        <PriceChart data={chartData} />
      ) : (
        <p className="text-[rgb(var(--muted))] italic">
          Data belum cukup untuk menampilkan chart (minimal 7 hari).
        </p>
      )}

      {/* TABLE */}
      <div className="mt-10 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5">
            <tr>
              <th className="px-4 py-3 text-left">Scraped At</th>
              <th className="px-4 py-3 text-left">Market Price</th>
              <th className="px-4 py-3 text-left">Range</th>
              <th className="px-4 py-3 text-left">Samples</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--border))]">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-black/5 transition">
                <td className="px-4 py-3 text-[rgb(var(--muted))]">
                  {formatDate(log.scraped_at)}
                </td>
                <td className="px-4 py-3 font-semibold">
                  {formatCurrency(log.market_price)}
                </td>
                <td className="px-4 py-3 text-[rgb(var(--muted))]">
                  {formatCurrency(log.min_price)} –{" "}
                  {formatCurrency(log.max_price)}
                </td>
                <td className="px-4 py-3 text-[rgb(var(--muted))]">
                  {log.sample_count} items
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
