"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useAuth } from "../lib/AuthContext";

// Minimal store: emits a value only once when the client mounts.
function createClientStore() {
  let value = false;
  const listeners = new Set();
  return {
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getSnapshot() {
      if (typeof document !== "undefined" && !value) {
        value = true;
        listeners.forEach((fn) => fn());
      }
      return value;
    },
  };
}

const clientStore = createClientStore();

export default function AuthNav() {
  const { user, logout } = useAuth();
  const mounted = useSyncExternalStore(
    clientStore.subscribe,
    clientStore.getSnapshot,
    () => false // server snapshot
  );

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
