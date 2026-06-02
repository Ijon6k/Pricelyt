"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";

/**
 * Editorial insight: evaluates the current price vs historical average.
 * Presented as a metric label, not a card widget.
 */
export default function DealScore({ priceLogs }) {
  if (!priceLogs || priceLogs.length === 0) return null;

  const latest = priceLogs[priceLogs.length - 1].market_price;
  const prices = priceLogs.map((p) => p.market_price);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

  const deviation = ((latest - avg) / avg) * 100;

  let Icon, label, color;

  if (deviation < -5) {
    Icon = TrendingDown;
    label = `Great deal — ${Math.abs(deviation).toFixed(0)}% below average`;
    color = "text-[rgb(var(--success))]";
  } else if (deviation > 5) {
    Icon = TrendingUp;
    label = `Above typical — ${deviation.toFixed(0)}% over average`;
    color = "text-[rgb(var(--danger))]";
  } else {
    Icon = Minus;
    label = "Near the long-term average";
    color = "text-[rgb(var(--muted))]";
  }

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);

  return (
    <div className={`flex items-center gap-1.5 text-xs ${color}`}>
      <Icon size={13} />
      <span>{label}</span>
      <span className="text-[rgb(var(--muted-lighter))]">
        · avg {formatCurrency(avg)}
      </span>
    </div>
  );
}
