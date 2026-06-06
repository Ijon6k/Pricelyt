import SearchBar from "./components/SearchBar";
import TabsAndWatchlist from "./components/TabsAndWatchlist";
import HeroIllustration from "./components/HeroIllustration";
import { fetchTrackers } from "./lib/api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let trackers = [];
  try {
    const data = await fetchTrackers();
    trackers = data || [];
  } catch (error) {
    console.error("Failed to load trackers:", error);
  }

  const hasTrackers = trackers.length > 0;
  const activeTrackers = trackers.filter(t => t.status === "READY").length;
  const totalDataPoints = trackers.reduce((s, t) => s + (t.price_log_count || 0), 0);

  return (
    <main className="min-h-screen">
      {/* HERO */}
      <section className="relative border-b border-[rgb(var(--border))] overflow-hidden">
        {/* Background chart SVG */}
        <HeroIllustration />

        <div className="relative z-10 max-w-screen-2xl mx-auto px-6 xl:px-10 py-16 md:py-24">
          {/* Editorial kicker */}
          <p className="editorial-label mb-3">Price intelligence</p>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] mb-4 max-w-3xl text-[rgb(var(--fg))]">
            Know when to buy.
          </h1>

          {/* Subtitle — single line, direct */}
          <p className="text-base md:text-[15px] text-[rgb(var(--muted))] mb-8 max-w-xl leading-relaxed">
            Monitor prices across Amazon and eBay. Analyze trends, compare deals,
            make smarter buying decisions.
          </p>

          {/* Search — prominent, above fold */}
          <div className="max-w-xl">
            <SearchBar />
          </div>

          {/* Stats — compressed editorial row */}
          {hasTrackers && (
            <div className="flex items-center gap-6 mt-10 pt-8 border-t border-[rgb(var(--border-soft))]">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold tabular-nums text-[rgb(var(--accent))]">
                  {trackers.length}
                </span>
                <span className="text-xs text-[rgb(var(--muted))]">products tracked</span>
              </div>
              <span className="text-xs text-[rgb(var(--border))] select-none">|</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold tabular-nums text-[rgb(var(--accent))]">
                  {activeTrackers}
                </span>
                <span className="text-xs text-[rgb(var(--muted))]">active</span>
              </div>
              <span className="text-xs text-[rgb(var(--border))] select-none">|</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold tabular-nums text-[rgb(var(--accent))]">
                  {totalDataPoints}
                </span>
                <span className="text-xs text-[rgb(var(--muted))]">data points</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* TRACKER LIST */}
      <section className="max-w-screen-2xl mx-auto px-6 xl:px-10 py-12">
        {!hasTrackers ? (
          <div className="py-20 text-center max-w-sm mx-auto">
            <p className="text-sm text-[rgb(var(--muted))] mb-1">
              No products tracked yet.
            </p>
            <p className="text-xs text-[rgb(var(--muted-lighter))]">
              Search a product above to start.
            </p>
          </div>
        ) : (
          <TabsAndWatchlist trackers={trackers} />
        )}
      </section>
    </main>
  );
}
