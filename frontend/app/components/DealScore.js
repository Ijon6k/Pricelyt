"use client";

import { ThumbsUp, ThumbsDown, Minus } from "lucide-react";

export default function DealScore({ priceLogs }) {
  if (!priceLogs || priceLogs.length === 0) return null;

  const latest = priceLogs[priceLogs.length - 1].market_price;
  const prices = priceLogs.map((p) => p.market_price);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

  // Percent deviation from average
  const deviation = ((latest - avg) / avg) * 100;

  let Icon, label, color, bgColor;

  if (deviation < -5) {
    Icon = ThumbsUp;
    label = `Great deal — ${Math.abs(deviation).toFixed(0)}% below average`;
    color = "text-emerald-600 dark:text-emerald-400";
    bgColor = "bg-emerald-500/10 border-emerald-500/20";
  } else if (deviation > 5) {
    Icon = ThumbsDown;
    label = `Above typical — ${deviation.toFixed(0)}% over average`;
    color = "text-red-600 dark:text-red-400";
    bgColor = "bg-red-500/10 border-red-500/20";
  } else {
    Icon = Minus;
    label = "Near the long-term average";
    color = "text-[rgb(var(--muted))]";
    bgColor = "bg-[rgb(var(--card))] border-[rgb(var(--border))]";
  }

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${bgColor} ${color}`}>
      <Icon size={13} />
      <div>
        <span className="font-medium">{label}</span>
        <span className="text-[rgb(var(--muted))] ml-1">
          (avg {formatCurrency(avg)})
        </span>
      </div>
    </div>
  );
}
