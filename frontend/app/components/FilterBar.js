"use client";

import { Check, ArrowUpDown, Eye, Clock } from "lucide-react";

const FILTERS = [
  { key: "newest", label: "Newest", icon: Clock },
  { key: "most_tracked", label: "Most Tracked", icon: Eye },
  { key: "all", label: "All", icon: ArrowUpDown },
];

export default function FilterBar({ active, onChange }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-[rgb(var(--muted))] mr-1">Sort:</span>
      {FILTERS.map(({ key, label, icon: Icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isActive
                ? "bg-[rgb(var(--accent))] text-white"
                : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]"
            }`}
          >
            <Icon size={12} />
            {label}
            {isActive && <Check size={10} />}
          </button>
        );
      })}
    </div>
  );
}
