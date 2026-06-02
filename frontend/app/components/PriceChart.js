"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(val);

  const date = new Date(label).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg px-3 py-2 shadow-sm">
      <p className="text-[10px] text-[rgb(var(--muted))] mb-0.5">{date}</p>
      <p className="text-sm font-semibold tabular-nums text-[rgb(var(--fg))]">
        {formatted}
      </p>
    </div>
  );
}

export default function PriceChart({ data }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((log) => ({
      date: log.scraped_at,
      price: Number(log.market_price) || 0,
    }));
  }, [data]);

  if (chartData.length < 2) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-[rgb(var(--muted))]">
        Not enough data points for a chart yet. Need at least 2 price records.
      </div>
    );
  }

  const prices = chartData.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = Math.max((maxPrice - minPrice) * 0.08, 1);

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
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
            domain={[minPrice - padding, maxPrice + padding]}
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
              r: 4,
              fill: "rgb(var(--accent))",
              stroke: "rgb(var(--card))",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
