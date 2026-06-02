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
      {/* EDITORIAL HERO */}
      <section className="relative overflow-hidden border-b border-[rgb(var(--border))]">
        {/* Subtle chart-inspired background */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <svg
            className="w-full h-full opacity-[0.04] dark:opacity-[0.06]"
            viewBox="0 0 1200 400"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.08" />
                <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0 280 Q100 320 200 260 T400 240 T600 280 T800 200 T1000 220 T1200 180 L1200 400 L0 400Z"
              fill="url(#heroGrad)"
            />
            <path
              d="M0 320 Q150 280 300 300 T500 260 T700 290 T900 240 T1100 260 T1200 230"
              fill="none"
              stroke="rgb(var(--accent))"
              strokeWidth="1.5"
              opacity="0.3"
            />
            <path
              d="M0 350 Q200 320 400 330 T600 300 T800 320 T1000 290 T1200 310"
              fill="none"
              stroke="rgb(var(--accent))"
              strokeWidth="0.8"
              opacity="0.2"
            />
          </svg>
        </div>

        <div className="max-w-3xl mx-auto px-6 pt-28 pb-24 text-center relative">
          <p className="editorial-label mb-5">Price research platform</p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight leading-[1.08] mb-5 editorial-headline">
            Track any product&rsquo;s price over time
          </h1>
          <p className="text-base text-[rgb(var(--muted))] mb-10 max-w-lg mx-auto leading-relaxed">
            Search a product, and Pricelyt monitors its market price
            and related news automatically.
          </p>
          <div className="max-w-xl mx-auto">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* TRACKER LIST */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        {trackers.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[rgb(var(--accent-soft))] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="rgb(var(--accent))" strokeWidth="1.5">
                <path d="M2 10L6 6L10 10L18 2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 14L6 10L10 14L18 6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-sm text-[rgb(var(--muted))]">
              No trackers yet. Search a product to start.
            </p>
          </div>
        ) : (
          <TrackerList trackers={trackers} />
        )}
      </section>
    </main>
  );
}
