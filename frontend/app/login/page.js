"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(email, password);
      login(data.token, data.user);
      router.push("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="editorial-label mb-3">Account</p>
          <h1 className="text-3xl font-normal editorial-headline tracking-tight mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-[rgb(var(--muted))]">
            Log in to your Pricelyt account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="editorial-label block mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))] text-sm focus:outline-none focus:border-[rgb(var(--accent))] focus:ring-1 focus:ring-[rgb(var(--accent))] placeholder:text-[rgb(var(--muted-lighter))]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="editorial-label block mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))] text-sm focus:outline-none focus:border-[rgb(var(--accent))] focus:ring-1 focus:ring-[rgb(var(--accent))] placeholder:text-[rgb(var(--muted-lighter))]"
              placeholder="Your password"
            />
          </div>

          {error && (
            <div className="text-xs text-[rgb(var(--danger))] bg-[rgb(var(--danger))]/5 border border-[rgb(var(--danger))]/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="text-center text-xs text-[rgb(var(--muted))] mt-8">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[rgb(var(--accent))] hover:text-[rgb(var(--accent))]/70 transition-colors font-medium">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
