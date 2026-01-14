"use client";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);
    document.documentElement.dataset.theme = saved;
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
  };

  return (
    <button
      onClick={toggleTheme}
      className="
        fixed top-6 right-6 z-50
        flex items-center gap-2
        bg-[rgb(var(--card))]
        border border-[rgb(var(--border))]
        shadow-sm hover:shadow-md
        rounded-full px-4 py-2
        text-sm font-medium
        transition
      "
    >
      {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
      {theme === "light" ? "Dark" : "Light"}
    </button>
  );
}
