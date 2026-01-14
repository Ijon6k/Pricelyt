"use client";

export default function TimeframeSelector({ options, active, onChange }) {
  return (
    <div
      className="
      flex items-center gap-2
      bg-black/5 rounded-xl p-1
      border border-[rgb(var(--border))]
    "
    >
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`
            px-4 py-1.5 rounded-lg text-sm font-medium transition
            ${
              active === opt.key
                ? "bg-[rgb(var(--accent))] text-white"
                : "hover:bg-black/10"
            }
          `}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
