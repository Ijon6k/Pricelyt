export default function Logo() {
  return (
    <div className="flex items-center gap-2 no-underline">
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="shrink-0"
      >
        <rect width="20" height="20" rx="6" fill="rgb(var(--accent))" />
        <path
          d="M5 13.5L8 9L11 11.5L15 6.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-base font-semibold tracking-tight text-[rgb(var(--fg))]">
        Pricelyt
      </span>
    </div>
  );
}
