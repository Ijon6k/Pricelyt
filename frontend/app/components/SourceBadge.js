/**
 * Source badge — shows marketplace source (Amazon / eBay).
 */
export default function SourceBadge({ source }) {
  if (!source) return null;

  const config = {
    amazon: {
      label: "Amazon",
      color: "text-[rgb(var(--accent))] bg-[rgb(var(--accent-soft))]",
    },
    ebay: {
      label: "eBay",
      color: "text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-400/10",
    },
  };

  const c = config[source.toLowerCase()] || {
    label: source,
    color: "text-[rgb(var(--muted))] bg-[rgb(var(--border))]/50",
  };

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium tracking-wide uppercase ${c.color}`}
    >
      {c.label}
    </span>
  );
}
