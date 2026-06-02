"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../lib/AuthContext";

export default function AuthNav() {
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-[rgb(var(--muted))] truncate max-w-[140px]">
          {user.email}
        </span>
        <button
          onClick={logout}
          className="text-[11px] font-medium uppercase tracking-wider text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="text-[11px] font-medium uppercase tracking-wider text-[rgb(var(--accent))] hover:text-[rgb(var(--accent))]/70 transition-colors"
    >
      Log in
    </Link>
  );
}
