"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../lib/AuthContext";

export default function AuthNav() {
  const { user, logout } = useAuth();
  const [mounted] = useState(() => {
    if (typeof window === "undefined") return false;
    return true;
  });

  if (!mounted) return null;

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-[rgb(var(--muted))] truncate max-w-[140px]">
          {user.email}
        </span>
        <button
          onClick={logout}
          className="text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="text-xs font-medium uppercase tracking-wider text-[rgb(var(--accent))] hover:text-[rgb(var(--accent))]/70 transition-colors"
    >
      Log in
    </Link>
  );
}
