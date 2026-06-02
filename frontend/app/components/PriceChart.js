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

// Snapshot once at module load so React Compiler doesn't complain
// about impure calls inside component.
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

  // Calculate delta from previous point
  const prevVal = payload[0]?.payload?.prevPrice;
  const delta = prevVal != null ? val - prevVal : null;
  const deltaPct = delta != null && prevVal > 0
    ? ((delta / prevVal) * 100).toFixed(1)
    : null;

  return (
    <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg px-3.5 py-2.5 shadow-sm min-w-[140px]">
      <p className="text-[10px] text-[rgb(var(--muted))] mb-1">{date}</p>
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

  const isStatic = filteredData.length < 2;

  const toggleLine = (key) => {
    setHiddenLines((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Range selector */}
      <div className="flex items-center gap-1 mb-4">
        {RANGES.map((r) => {
          const isActive = range === r.key;
          const isDisabled = r.days !== Infinity && chartData.length > 0 &&
            r.days * 86400000 <
              (new Date(chartData[chartData.length - 1].date).getTime() -
                new Date(chartData[0].date).getTime())
            ? false
            : r.days === Infinity
              ? false
              : true;
          return (
            <button
              key={r.key}
              onClick={() => !isDisabled && setRange(r.key)}
              disabled={isDisabled && r.days !== Infinity}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                isActive
                  ? "bg-[rgb(var(--accent))] text-white"
                  : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--border))]/30"
              } ${isDisabled ? "opacity-30 cursor-not-allowed" : ""}`}
            >
              {r.label}
            </button>
          );
        })}

        {/* Min/max legend */}
        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={!hiddenLines.has("min")}
              onChange={() => toggleLine("min")}
              className="w-2.5 h-2.5 accent-[rgb(var(--accent))]"
            />
            <span className="text-[10px] text-[rgb(var(--muted))]">Min</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={!hiddenLines.has("max")}
              onChange={() => toggleLine("max")}
              className="w-2.5 h-2.5 accent-[rgb(var(--accent))]"
            />
            <span className="text-[10px] text-[rgb(var(--muted))]">Max</span>
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

            {/* All-time min/max reference lines */}
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
                  fontSize: 10,
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
                  fontSize: 10,
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
              fontSize={11}
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
              fontSize={11}
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

      {/* Summary stats */}
      {filteredData.length >= 2 && (
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[rgb(var(--border))] text-[11px] text-[rgb(var(--muted))]">
          <span className="tabular-nums">
            <span className="font-medium text-[rgb(var(--fg))]">{filteredData.length}</span> data points
          </span>
          <span className="tabular-nums">
            Low: <span className="font-medium text-[rgb(var(--fg))]">{formatCurrency(minPrice)}</span>
          </span>
          <span className="tabular-nums">
            High: <span className="font-medium text-[rgb(var(--fg))]">{formatCurrency(maxPrice)}</span>
          </span>
        </div>
      )}
    </div>
  );
}
