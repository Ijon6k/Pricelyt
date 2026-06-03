"use client";

import { List, Grid3x3, Table } from "lucide-react";

const MODES = [
  { key: "list", label: "List", icon: List },
  { key: "grid", label: "Grid", icon: Grid3x3 },
  { key: "table", label: "Table", icon: Table },
];

export default function ViewToggle({ active, onChange }) {
  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[rgb(var(--border))]/40">
      {MODES.map(({ key, label, icon: Icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            title={label}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              isActive
                ? "bg-[rgb(var(--card))] text-[rgb(var(--accent))] shadow-sm"
                : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
            }`}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
