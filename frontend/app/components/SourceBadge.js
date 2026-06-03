/**
 * Source label — simple text showing marketplace (Amazon / eBay).
 * No badge, no color — just clean text.
 */
export default function SourceBadge({ source }) {
  if (!source) return null;

  const label =
    source.toLowerCase() === "amazon"
      ? "Amazon"
      : source.toLowerCase() === "ebay"
        ? "eBay"
        : source;

  return (
    <span className="text-xs text-[rgb(var(--muted))] font-medium tracking-wide uppercase">
      {label}
    </span>
  );
}
