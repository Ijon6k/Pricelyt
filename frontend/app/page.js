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
        {/* Sophisticated chart-inspired background */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <svg
            className="w-full h-full opacity-[0.05] dark:opacity-[0.07]"
            viewBox="0 0 1200 500"
            preserveAspectRatio="none"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <defs>
              <linearGradient id="heroGrad1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.12" />
                <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="heroGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.08" />
                <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <g stroke="rgb(var(--muted-lighter))" strokeWidth="0.3" opacity="0.15">
              <line x1="0" y1="100" x2="1200" y2="100" />
              <line x1="0" y1="180" x2="1200" y2="180" />
              <line x1="0" y1="260" x2="1200" y2="260" />
              <line x1="0" y1="340" x2="1200" y2="340" />
              <line x1="0" y1="420" x2="1200" y2="420" />
            </g>

            {/* Price chart area — major trend line */}
            <path
              d="M0 380
                 C60 370, 90 380, 120 340
                 C150 300, 170 310, 200 280
                 C230 250, 260 260, 300 220
                 C320 200, 340 210, 380 190
                 C420 170, 450 180, 500 160
                 C550 140, 580 150, 620 120
                 C660 90, 690 100, 730 110
                 C770 120, 800 130, 850 85
                 C900 40, 930 50, 980 60
                 C1030 70, 1060 80, 1100 55
                 C1140 30, 1170 40, 1200 45
                 L1200 500 L0 500Z"
              fill="url(#heroGrad1)"
            />
            <path
              d="M0 380
                 C60 370, 90 380, 120 340
                 C150 300, 170 310, 200 280
                 C230 250, 260 260, 300 220
                 C320 200, 340 210, 380 190
                 C420 170, 450 180, 500 160
                 C550 140, 580 150, 620 120
                 C660 90, 690 100, 730 110
                 C770 120, 800 130, 850 85
                 C900 40, 930 50, 980 60
                 C1030 70, 1060 80, 1100 55
                 C1140 30, 1170 40, 1200 45"
              fill="none"
              stroke="rgb(var(--accent))"
              strokeWidth="2"
              opacity="0.35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Secondary trend line (smoother, longer-term) */}
            <path
              d="M0 400
                 C100 390, 200 410, 300 370
                 C400 330, 500 340, 600 300
                 C700 260, 800 270, 900 240
                 C1000 210, 1100 220, 1200 200
                 L1200 500 L0 500Z"
              fill="url(#heroGrad2)"
            />
            <path
              d="M0 400
                 C100 390, 200 410, 300 370
                 C400 330, 500 340, 600 300
                 C700 260, 800 270, 900 240
                 C1000 210, 1100 220, 1200 200"
              fill="none"
              stroke="rgb(var(--accent))"
              strokeWidth="1"
              opacity="0.2"
              strokeDasharray="4 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Volume bars at bottom */}
            <g opacity="0.08">
              <rect x="40" y="420" width="8" height="40" rx="1" fill="rgb(var(--accent))" />
              <rect x="60" y="440" width="8" height="20" rx="1" fill="rgb(var(--accent))" />
              <rect x="90" y="430" width="8" height="30" rx="1" fill="rgb(var(--accent))" />
              <rect x="130" y="410" width="8" height="50" rx="1" fill="rgb(var(--accent))" />
              <rect x="170" y="445" width="8" height="15" rx="1" fill="rgb(var(--accent))" />
              <rect x="210" y="420" width="8" height="40" rx="1" fill="rgb(var(--accent))" />
              <rect x="250" y="435" width="8" height="25" rx="1" fill="rgb(var(--accent))" />
              <rect x="290" y="415" width="8" height="45" rx="1" fill="rgb(var(--accent))" />
              <rect x="330" y="440" width="8" height="20" rx="1" fill="rgb(var(--accent))" />
              <rect x="370" y="425" width="8" height="35" rx="1" fill="rgb(var(--accent))" />
              <rect x="410" y="405" width="8" height="55" rx="1" fill="rgb(var(--accent))" />
              <rect x="450" y="430" width="8" height="30" rx="1" fill="rgb(var(--accent))" />
              <rect x="490" y="420" width="8" height="40" rx="1" fill="rgb(var(--accent))" />
              <rect x="530" y="445" width="8" height="15" rx="1" fill="rgb(var(--accent))" />
              <rect x="570" y="410" width="8" height="50" rx="1" fill="rgb(var(--accent))" />
              <rect x="610" y="425" width="8" height="35" rx="1" fill="rgb(var(--accent))" />
              <rect x="650" y="440" width="8" height="20" rx="1" fill="rgb(var(--accent))" />
              <rect x="690" y="415" width="8" height="45" rx="1" fill="rgb(var(--accent))" />
              <rect x="730" y="430" width="8" height="30" rx="1" fill="rgb(var(--accent))" />
              <rect x="770" y="420" width="8" height="40" rx="1" fill="rgb(var(--accent))" />
              <rect x="810" y="440" width="8" height="20" rx="1" fill="rgb(var(--accent))" />
              <rect x="850" y="410" width="8" height="50" rx="1" fill="rgb(var(--accent))" />
              <rect x="890" y="425" width="8" height="35" rx="1" fill="rgb(var(--accent))" />
              <rect x="930" y="445" width="8" height="15" rx="1" fill="rgb(var(--accent))" />
              <rect x="970" y="420" width="8" height="40" rx="1" fill="rgb(var(--accent))" />
              <rect x="1010" y="430" width="8" height="30" rx="1" fill="rgb(var(--accent))" />
              <rect x="1050" y="415" width="8" height="45" rx="1" fill="rgb(var(--accent))" />
              <rect x="1090" y="440" width="8" height="20" rx="1" fill="rgb(var(--accent))" />
              <rect x="1130" y="425" width="8" height="35" rx="1" fill="rgb(var(--accent))" />
              <rect x="1160" y="435" width="8" height="25" rx="1" fill="rgb(var(--accent))" />
            </g>

            {/* Data point dots on the main line */}
            <g fill="rgb(var(--accent))" opacity="0.15">
              <circle cx="120" cy="340" r="2.5" />
              <circle cx="300" cy="220" r="2.5" />
              <circle cx="500" cy="160" r="2.5" />
              <circle cx="620" cy="120" r="2.5" />
              <circle cx="850" cy="85" r="2.5" />
              <circle cx="1100" cy="55" r="2.5" />
              <circle cx="1200" cy="45" r="2.5" />
            </g>
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
          <div className="py-20 text-center max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[rgb(var(--accent-soft))] flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="rgb(var(--accent))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 18L8 12L12 15L18 8L24 12" />
                <path d="M4 22L8 16L12 19L18 12L24 16" opacity="0.5" />
                <circle cx="8" cy="8" r="1.5" fill="rgb(var(--accent))" opacity="0.3" />
                <circle cx="18" cy="5" r="1.5" fill="rgb(var(--accent))" opacity="0.3" />
                <circle cx="22" cy="9" r="1.5" fill="rgb(var(--accent))" opacity="0.3" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[rgb(var(--fg))] mb-2 editorial-headline">
              No products tracked yet
            </h2>
            <p className="text-sm text-[rgb(var(--muted))] mb-8 leading-relaxed">
              Search for any product to start monitoring its market price automatically. You&rsquo;ll get price history, trends, and related news in one place.
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
