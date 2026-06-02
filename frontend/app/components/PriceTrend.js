"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";

export default function PriceTrend({ priceLogs }) {
  if (!priceLogs || priceLogs.length < 3) return null;

  // Simple linear regression: y = mx + b
  const n = priceLogs.length;
  const xValues = priceLogs.map((_, i) => i);
  const yValues = priceLogs.map((p) => p.market_price);

  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((s, x, i) => s + x * yValues[i], 0);
  const sumX2 = xValues.reduce((s, x) => s + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  // Categorize trend
  const threshold = 0.01; // near-zero = flat
  let TrendIcon, label, color;

  if (slope > threshold) {
    TrendIcon = TrendingUp;
    label = "Trending up";
    color = "text-emerald-500";
  } else if (slope < -threshold) {
    TrendIcon = TrendingDown;
    label = "Trending down";
    color = "text-red-500";
  } else {
    TrendIcon = Minus;
    label = "Flat";
    color = "text-[rgb(var(--muted))]";
  }

  return (
    <div className={`flex items-center gap-1.5 text-xs ${color}`}>
      <TrendIcon size={13} />
      <span className="font-medium">{label}</span>
    </div>
  );
}
