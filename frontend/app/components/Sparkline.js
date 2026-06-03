"use client";

/**
 * Mini inline SVG sparkline for price trend previews.
 * Designed for the tracker list view — gives a quick visual sense
 * of price movement without the full chart overhead.
 *
 * Two modes:
 * - prices[] passed → renders actual sparkline from price history
 * - count passed → renders a simple data-activity indicator (dot series)
 */
export default function Sparkline({ prices, count, width = 80, height = 24 }) {
  // Count-only mode: render data activity indicator
  if ((!prices || prices.length < 2) && count > 0) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        className="shrink-0"
      >
        <text
          x={width / 2}
          y={height / 2 + 1}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-[rgb(var(--muted))]"
          style={{ fontSize: "11px" }}
        >
          {count} pts
        </text>
      </svg>
    );
  }

  if (!prices || prices.length < 2) return null;

  const vals = prices.map((p) => Number(p) || 0);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;

  const points = vals
    .map((v, i) => {
      const x = (i / (vals.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const isUp = vals[vals.length - 1] >= vals[0];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className="shrink-0"
    >
      <path
        d={`M${points}`}
        stroke={isUp ? "rgb(var(--success))" : "rgb(var(--danger))"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  );
}
