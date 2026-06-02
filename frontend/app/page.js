import SearchBar from "./components/SearchBar";
import TrackerList from "./components/TrackerList";
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

  return (
    <main className="min-h-screen">
      {/* HERO */}
      <section className="relative section-tint border-b border-[rgb(var(--border))]">
        <div className="max-w-screen-2xl mx-auto px-6 xl:px-10 pt-28 pb-24 text-center relative">
          {/* Ornament */}
          <div className="flex justify-center mb-6">
            <div className="ornament-bar h-10 w-1 opacity-30" />
          </div>

          <p className="editorial-label mb-4">Price research platform</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight leading-[1.05] mb-6 max-w-5xl mx-auto">
            Track any product&rsquo;s price over time
          </h1>
          <p className="text-base md:text-lg text-[rgb(var(--muted))] mb-10 max-w-2xl mx-auto leading-relaxed">
            Search a product, and Pricelyt monitors its market price
            and related news automatically. Get alerts when prices drop.
          </p>

          <div className="max-w-2xl mx-auto relative z-10">
            <SearchBar />
          </div>

          {/* Stats */}
          {trackers.length > 0 && (
            <div className="flex items-center justify-center gap-10 mt-14">
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-3xl font-bold tabular-nums text-[rgb(var(--fg))]">
                  {trackers.length}
                </span>
                <span className="editorial-label">Tracked products</span>
              </div>
              <div className="w-px h-12 bg-[rgb(var(--border))]" />
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-3xl font-bold tabular-nums text-[rgb(var(--fg))]">
                  {trackers.filter(t => t.status === "READY").length}
                </span>
                <span className="editorial-label">Active trackers</span>
              </div>
              <div className="w-px h-12 bg-[rgb(var(--border))]" />
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-3xl font-bold tabular-nums text-[rgb(var(--fg))]">
                  {trackers.reduce((s, t) => s + (t.price_logs?.length || 0), 0)}
                </span>
                <span className="editorial-label">Data points</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* TRACKER LIST */}
      <section className="max-w-screen-2xl mx-auto px-6 xl:px-10 py-16">
        {trackers.length === 0 ? (
          <div className="py-24 text-center max-w-lg mx-auto">
            <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-[rgb(var(--accent-soft))] flex items-center justify-center">
              <svg width="34" height="34" viewBox="0 0 28 28" fill="none" stroke="rgb(var(--accent))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 18L8 12L12 15L18 8L24 12" />
                <path d="M4 22L8 16L12 19L18 12L24 16" opacity="0.5" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-[rgb(var(--fg))] mb-3">
              No products tracked yet
            </h2>
            <p className="text-sm text-[rgb(var(--muted))] mb-8 leading-relaxed">
              Search for any product to start monitoring its market price automatically.
            </p>
            <div className="max-w-sm mx-auto">
              <SearchBar />
            </div>
          </div>
        ) : (
          <TrackerList trackers={trackers} />
        )}
      </section>
    </main>
  );
}
