"use client";

import Link from "next/link";
import { useAuth } from "../lib/AuthContext";
import { User } from "lucide-react";

export default function AuthNav() {
  const { user } = useAuth();

  if (user) {
    const displayName = user.username || user.email?.split("@")[0] || "Account";
    return (
      <Link
        href="/profile"
        className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors no-underline"
      >
        <User size={14} />
        <span className="truncate max-w-[120px]">{displayName}</span>
      </Link>
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
