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
      <section className="relative overflow-hidden border-b border-[rgb(var(--border))]">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[rgb(var(--accent-subtle))] to-[rgb(var(--bg))]" />

        {/* Chart illustration — subtle, decorative */}
        <div className="absolute inset-0 flex items-end justify-center opacity-[0.07] dark:opacity-[0.05]">
          <svg
            viewBox="0 0 1200 400"
            className="w-full h-full"
            fill="none"
            preserveAspectRatio="xMidYMax slice"
          >
            {/* Grid lines */}
            {[80, 160, 240, 320].map((y) => (
              <line key={y} x1="0" y1={y} x2="1200" y2={y} stroke="rgb(var(--accent))" strokeWidth="0.5" strokeDasharray="4 8" />
            ))}
            {[200, 400, 600, 800, 1000].map((x) => (
              <line key={x} x1={x} y1="0" x2={x} y2="400" stroke="rgb(var(--accent))" strokeWidth="0.5" strokeDasharray="4 8" />
            ))}

            {/* Area fill under curve */}
            <path
              d="M0 350 Q100 320 200 300 T400 220 T600 180 T800 140 T1000 100 T1200 80 V400 H0 Z"
              fill="url(#heroGrad)"
            />

            {/* Main trend line */}
            <path
              d="M0 350 Q100 320 200 300 T400 220 T600 180 T800 140 T1000 100 T1200 80"
              stroke="rgb(var(--accent))"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Secondary trend line (moving average) */}
            <path
              d="M0 340 Q150 310 300 280 T600 200 T900 150 T1200 120"
              stroke="rgb(var(--accent))"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="6 4"
              opacity="0.5"
            />

            {/* Data points */}
            {[
              [200, 300], [400, 220], [600, 180], [800, 140], [1000, 100],
            ].map(([cx, cy], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r="4" fill="rgb(var(--accent))" opacity="0.6" />
                <circle cx={cx} cy={cy} r="2" fill="white" opacity="0.8" />
              </g>
            ))}

            {/* Price annotation */}
            <g transform="translate(980, 85)">
              <rect x="-40" y="-14" width="80" height="22" rx="4" fill="rgb(var(--accent))" opacity="0.8" />
              <text x="0" y="2" textAnchor="middle" fill="white" fontSize="11" fontWeight="600" fontFamily="JetBrains Mono, monospace">
                $129.99
              </text>
            </g>

            <defs>
              <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="max-w-screen-2xl mx-auto px-6 xl:px-10 pt-28 pb-24 text-center relative z-10">
          {/* Label */}
          <p className="editorial-label mb-4">Price intelligence platform</p>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight leading-[1.05] mb-6 max-w-5xl mx-auto">
            Know when to buy
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-[rgb(var(--muted))] mb-10 max-w-2xl mx-auto leading-relaxed">
            Track any product&rsquo;s market price over time. Pricelyt monitors prices
            from Amazon and eBay, analyzes trends, and tells you when it&rsquo;s a good deal.
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto relative z-10">
            <SearchBar />
          </div>

          {/* Stats */}
          {trackers.length > 0 && (
            <div className="flex items-center justify-center gap-10 mt-14">
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-3xl font-bold tabular-nums text-[rgb(var(--accent))]">
                  {trackers.length}
                </span>
                <span className="editorial-label">Tracked products</span>
              </div>
              <div className="w-px h-12 bg-[rgb(var(--border))]" />
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-3xl font-bold tabular-nums text-[rgb(var(--accent))]">
                  {trackers.filter(t => t.status === "READY").length}
                </span>
                <span className="editorial-label">Active trackers</span>
              </div>
              <div className="w-px h-12 bg-[rgb(var(--border))]" />
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-3xl font-bold tabular-nums text-[rgb(var(--accent))]">
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
