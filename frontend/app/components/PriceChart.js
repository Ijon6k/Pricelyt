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
import { format } from "date-fns";

export default function PriceChart({ data }) {
  // Format data untuk Recharts
  // Kita balik arraynya agar urut dari tanggal lama ke baru (kiri ke kanan)
  const chartData = [...data].reverse().map((log) => ({
    date: log.scraped_at,
    price: log.market_price,
    label: format(new Date(log.scraped_at), "dd MMM"),
    fullDate: format(new Date(log.scraped_at), "dd MMM yyyy, HH:mm"),
  }));

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="rgb(var(--accent))"
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor="rgb(var(--accent))"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgb(var(--border))"
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgb(var(--muted))", fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgb(var(--muted))", fontSize: 12 }}
            tickFormatter={(val) => `$${val}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgb(var(--card))",
              borderColor: "rgb(var(--border))",
              borderRadius: "8px",
              color: "rgb(var(--fg))",
            }}
            itemStyle={{ color: "rgb(var(--accent))" }}
            labelStyle={{ color: "rgb(var(--muted))", marginBottom: "0.5rem" }}
            formatter={(value) => [`$${value.toLocaleString()}`, "Price"]}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) return payload[0].payload.fullDate;
              return label;
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="rgb(var(--accent))"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPrice)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
