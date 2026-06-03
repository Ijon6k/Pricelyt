"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useMemo, useState } from "react";

const RANGES = [
  { key: "1w", label: "1W", days: 7 },
  { key: "1m", label: "1M", days: 30 },
  { key: "3m", label: "3M", days: 90 },
  { key: "6m", label: "6M", days: 180 },
  { key: "all", label: "All", days: Infinity },
];

let _now = Date.now();

const formatCurrency = (val) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);

const formatCurrencyCompact = (val) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const date = new Date(label).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const prevVal = payload[0]?.payload?.prevPrice;
  const delta = prevVal != null ? val - prevVal : null;
  const deltaPct = delta != null && prevVal > 0
    ? ((delta / prevVal) * 100).toFixed(1)
    : null;

  return (
    <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg px-3.5 py-2.5 shadow-sm min-w-[140px]">
      <p className="text-xs text-[rgb(var(--muted))] mb-1">{date}</p>
      <p className="text-base font-semibold tabular-nums text-[rgb(var(--fg))]">
        {formatCurrency(val)}
      </p>
      {delta != null && deltaPct != null && (
        <p
          className={`text-xs tabular-nums mt-0.5 ${
            delta > 0
              ? "text-emerald-500"
              : delta < 0
                ? "text-red-500"
                : "text-[rgb(var(--muted))]"
          }`}
        >
          {delta > 0 ? "▲" : delta < 0 ? "▼" : "—"} {delta > 0 ? "+" : ""}
          {formatCurrency(delta)} ({deltaPct}%)
        </p>
      )}
    </div>
  );
}

export default function PriceChart({ data }) {
  const [range, setRange] = useState("all");
  const [hiddenLines, setHiddenLines] = useState(new Set());

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((log, i) => ({
      date: log.scraped_at,
      price: Number(log.market_price) || 0,
      prevPrice: i > 0 ? Number(data[i - 1].market_price) || 0 : null,
    }));
  }, [data]);

  const filteredData = useMemo(() => {
    const r = RANGES.find((rr) => rr.key === range) || RANGES[RANGES.length - 1];
    if (r.days === Infinity) return chartData;
    const cutoff = _now - r.days * 86400000;
    return chartData.filter((d) => new Date(d.date).getTime() >= cutoff);
  }, [chartData, range]);

  if (chartData.length < 2) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-[rgb(var(--muted))]">
        Not enough data points for a chart yet. Need at least 2 price records.
      </div>
    );
  }

  const prices = filteredData.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = Math.max((maxPrice - minPrice) * 0.08, 1);
  const domainMin = minPrice - padding;
  const domainMax = maxPrice + padding;

  const allPrices = chartData.map((d) => d.price);
  const allTimeMin = Math.min(...allPrices);
  const allTimeMax = Math.max(...allPrices);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Range selector + min/max toggles */}
      <div className="flex items-center gap-1 mb-4">
        {RANGES.map((r) => {
          const isActive = range === r.key;
          const hasData =
            chartData.length > 0 &&
            new Date(chartData[chartData.length - 1].date).getTime() -
              new Date(chartData[0].date).getTime() >=
              r.days * 86400000;
          const isDisabled = r.days !== Infinity && !hasData;
          return (
            <button
              key={r.key}
              onClick={() => !isDisabled && setRange(r.key)}
              disabled={isDisabled}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                isActive
                  ? "bg-[rgb(var(--accent))] text-white"
                  : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--border))]/30"
              } ${isDisabled ? "opacity-30 cursor-not-allowed" : ""}`}
            >
              {r.label}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-[rgb(var(--muted))]">
            <input
              type="checkbox"
              checked={!hiddenLines.has("min")}
              onChange={() => setHiddenLines((p) => { const n = new Set(p); n.has("min") ? n.delete("min") : n.add("min"); return n; })}
              className="w-3 h-3 accent-[rgb(var(--accent))]"
            />
            Min
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-[rgb(var(--muted))]">
            <input
              type="checkbox"
              checked={!hiddenLines.has("max")}
              onChange={() => setHiddenLines((p) => { const n = new Set(p); n.has("max") ? n.delete("max") : n.add("max"); return n; })}
              className="w-3 h-3 accent-[rgb(var(--accent))]"
            />
            Max
          </label>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={filteredData}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity={0.12} />
                <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="2 3"
              stroke="rgb(var(--border))"
              vertical={false}
            />

            {!hiddenLines.has("min") && filteredData.length >= 2 && (
              <ReferenceLine
                y={allTimeMin}
                stroke="rgb(var(--muted-lighter))"
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{
                  value: `Low ${formatCurrencyCompact(allTimeMin)}`,
                  position: "insideBottomLeft",
                  fill: "rgb(var(--muted))",
                  fontSize: 12,
                }}
              />
            )}
            {!hiddenLines.has("max") && filteredData.length >= 2 && (
              <ReferenceLine
                y={allTimeMax}
                stroke="rgb(var(--muted-lighter))"
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{
                  value: `High ${formatCurrencyCompact(allTimeMax)}`,
                  position: "insideTopLeft",
                  fill: "rgb(var(--muted))",
                  fontSize: 12,
                }}
              />
            )}

            <XAxis
              dataKey="date"
              tickFormatter={(v) =>
                new Date(v).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }
              stroke="rgb(var(--muted-lighter))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[domainMin, domainMax]}
              tickFormatter={(v) =>
                new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(v)
              }
              stroke="rgb(var(--muted-lighter))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke="rgb(var(--accent))"
              strokeWidth={2}
              fill="url(#priceGradient)"
              dot={false}
              activeDot={{
                r: 5,
                fill: "rgb(var(--accent))",
                stroke: "rgb(var(--card))",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {filteredData.length >= 2 && (
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))]">
          <span className="tabular-nums">
            <span className="font-semibold text-[rgb(var(--fg))]">{filteredData.length}</span> data points
          </span>
          <span className="tabular-nums">
            Low: <span className="font-semibold text-[rgb(var(--fg))]">{formatCurrency(minPrice)}</span>
          </span>
          <span className="tabular-nums">
            High: <span className="font-semibold text-[rgb(var(--fg))]">{formatCurrency(maxPrice)}</span>
          </span>
        </div>
      )}
    </div>
  );
}
