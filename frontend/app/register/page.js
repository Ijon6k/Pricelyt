"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

export default function RegisterPage() {
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
      const data = await registerUser(email, password);
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
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
          <p className="text-sm text-[rgb(var(--muted))] mt-2">
            Track prices across marketplaces.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:border-transparent"
              placeholder="Min. 8 characters"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-[rgb(var(--muted))] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[rgb(var(--accent))] hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
