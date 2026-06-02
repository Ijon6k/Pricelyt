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
      <>
        <span className="text-sm text-[rgb(var(--muted))] truncate max-w-[160px]">
          {user.email}
        </span>
        <button
          onClick={logout}
          className="text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors"
        >
          Log out
        </button>
      </>
    );
  }

  return (
    <Link
      href="/login"
      className="text-sm text-[rgb(var(--accent))] hover:underline"
    >
      Log in
    </Link>
  );
}
