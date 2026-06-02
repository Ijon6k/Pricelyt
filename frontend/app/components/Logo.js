export default function Logo() {
  return (
    <div className="flex items-center gap-2.5 no-underline">
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        className="shrink-0"
      >
        <rect width="22" height="22" rx="5" fill="rgb(var(--accent))" />
        <path
          d="M6 14L9 9.5L12 12L16 7"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-base font-bold tracking-tight text-[rgb(var(--fg))]">
        Pricelyt
      </span>
    </div>
  );
}
