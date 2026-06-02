"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../lib/AuthContext";
import { fetchProfile, fetchProfileStats, changePassword } from "../lib/api";
import {
  User,
  BarChart3,
  Eye,
  Database,
  Shield,
  ArrowLeft,
  Check,
  AlertCircle,
} from "lucide-react";

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Password change
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    async function load() {
      try {
        const [p, s] = await Promise.all([
          fetchProfile(token),
          fetchProfileStats(token),
        ]);
        setProfile(p);
        setStats(s);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-semibold mb-3">Sign in to view your profile</h2>
          <Link
            href="/login"
            className="text-sm text-[rgb(var(--accent))] hover:underline"
          >
            Go to login →
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-[rgb(var(--muted))]">Loading profile…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-[rgb(var(--danger))]">{error}</div>
      </main>
    );
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (newPw !== confirmPw) {
      setPwError("New passwords do not match");
      return;
    }
    if (newPw.length < 8) {
      setPwError("Password must be at least 8 characters");
      return;
    }

    setPwLoading(true);
    try {
      await changePassword(token, currentPw, newPw);
      setPwSuccess(true);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwLoading(false);
    }
  }

  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "-";

  return (
    <main className="min-h-screen">
      <div className="h-1 bg-gradient-to-r from-[rgb(var(--accent))]/30 via-[rgb(var(--accent))]/10 to-transparent" />

      <div className="max-w-2xl mx-auto px-6 xl:px-10 py-8">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors no-underline mb-10"
        >
          <ArrowLeft size={16} /> Back to overview
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-[rgb(var(--accent-soft))] flex items-center justify-center">
              <User size={24} className="text-[rgb(var(--accent))]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
              <p className="text-sm text-[rgb(var(--muted))]">
                Member since {joinDate}
              </p>
            </div>
          </div>
        </div>

        {/* Account info */}
        <section className="mb-10 p-6 rounded-lg border border-[rgb(var(--border))]">
          <h2 className="editorial-label mb-4">Account</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[rgb(var(--muted))]">Email</span>
              <span className="text-sm font-medium">{profile?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[rgb(var(--muted))]">User ID</span>
              <span className="text-xs font-mono text-[rgb(var(--muted-lighter))]">
                {profile?.id?.slice(0, 8)}…
              </span>
            </div>
          </div>
        </section>

        {/* Stats */}
        {stats && (
          <section className="mb-10 p-6 rounded-lg border border-[rgb(var(--border))]">
            <h2 className="editorial-label mb-4">Activity</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <BarChart3 size={18} className="text-[rgb(var(--accent))] mt-0.5" />
                <div>
                  <div className="text-2xl font-bold tabular-nums">{stats.total_trackers}</div>
                  <div className="text-xs text-[rgb(var(--muted))]">Total trackers</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Database size={18} className="text-[rgb(var(--accent))] mt-0.5" />
                <div>
                  <div className="text-2xl font-bold tabular-nums">{stats.active_trackers}</div>
                  <div className="text-xs text-[rgb(var(--muted))]">Active (ready)</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Eye size={18} className="text-[rgb(var(--accent))] mt-0.5" />
                <div>
                  <div className="text-2xl font-bold tabular-nums">{stats.total_views}</div>
                  <div className="text-xs text-[rgb(var(--muted))]">Total views</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Database size={18} className="text-[rgb(var(--accent))] mt-0.5" />
                <div>
                  <div className="text-2xl font-bold tabular-nums">{stats.total_data_points}</div>
                  <div className="text-xs text-[rgb(var(--muted))]">Price data points</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Change password */}
        <section className="p-6 rounded-lg border border-[rgb(var(--border))]">
          <h2 className="editorial-label mb-4">Change password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="text-sm text-[rgb(var(--muted))] mb-1.5 block">
                Current password
              </label>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--card))] focus:border-[rgb(var(--accent))] focus:ring-1 focus:ring-[rgb(var(--accent))]/30 outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-sm text-[rgb(var(--muted))] mb-1.5 block">
                New password
              </label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--card))] focus:border-[rgb(var(--accent))] focus:ring-1 focus:ring-[rgb(var(--accent))]/30 outline-none transition-colors"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="text-sm text-[rgb(var(--muted))] mb-1.5 block">
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--card))] focus:border-[rgb(var(--accent))] focus:ring-1 focus:ring-[rgb(var(--accent))]/30 outline-none transition-colors"
                required
                minLength={8}
              />
            </div>

            {pwError && (
              <div className="flex items-center gap-2 text-sm text-[rgb(var(--danger))]">
                <AlertCircle size={14} />
                {pwError}
              </div>
            )}
            {pwSuccess && (
              <div className="flex items-center gap-2 text-sm text-[rgb(var(--success))]">
                <Check size={14} />
                Password changed successfully
              </div>
            )}

            <button
              type="submit"
              disabled={pwLoading}
              className="px-4 py-2 text-sm font-medium rounded-md bg-[rgb(var(--accent))] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {pwLoading ? "Changing…" : "Change password"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
