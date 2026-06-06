export default function HeroIllustration() {
  return (
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

        {/* Third trend line — flatter baseline */}
        <path
          d="M0 330 Q200 300 400 290 T800 200 T1200 160"
          stroke="rgb(var(--accent))"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="2 6"
          opacity="0.3"
        />

        {/* Data points with pulse animation */}
        {[
          [200, 300], [400, 220], [600, 180], [800, 140], [1000, 100],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="6" fill="rgb(var(--accent))" opacity="0.15">
              <animate attributeName="r" values="6;10;6" dur={`${3 + i * 0.5}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.15;0.05;0.15" dur={`${3 + i * 0.5}s`} repeatCount="indefinite" />
            </circle>
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

        {/* Second price annotation — lower */}
        <g transform="translate(300, 275)">
          <rect x="-40" y="-14" width="80" height="22" rx="4" fill="rgb(var(--accent))" opacity="0.5" />
          <text x="0" y="2" textAnchor="middle" fill="white" fontSize="11" fontWeight="600" fontFamily="JetBrains Mono, monospace">
            $189.99
          </text>
        </g>

        {/* Trend arrow indicator */}
        <g transform="translate(1050, 50)">
          <path d="M0 20 L12 6 L12 14 L24 14 L24 20 L0 20 Z" fill="rgb(var(--accent))" opacity="0.6">
            <animateTransform attributeName="transform" type="translate" values="0,0;0,-3;0,0" dur="2s" repeatCount="indefinite" />
          </path>
        </g>

        {/* Decorative circles */}
        <circle cx="100" cy="60" r="30" stroke="rgb(var(--accent))" strokeWidth="0.5" fill="none" opacity="0.3">
          <animate attributeName="r" values="30;35;30" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="1100" cy="300" r="20" stroke="rgb(var(--accent))" strokeWidth="0.5" fill="none" opacity="0.2">
          <animate attributeName="r" values="20;25;20" dur="5s" repeatCount="indefinite" />
        </circle>

        <defs>
          <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
