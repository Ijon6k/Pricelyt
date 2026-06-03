"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../lib/AuthContext";
import { fetchProfile, fetchProfileStats, changePassword, updateProfile } from "../lib/api";
import {
  ArrowLeft,
  Check,
  AlertCircle,
  LogOut,
  Settings,
  AtSign,
  Loader2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function ProfilePage() {
  const { user, token, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Username editing
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameValue, setUsernameValue] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  // Password change
  const [showPassword, setShowPassword] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        if (p.username) setUsernameValue(p.username);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  // Don't render anything until client-side mounted (avoids hydration mismatch)
  if (!mounted) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[rgb(var(--muted))]">
          <Loader2 size={16} className="animate-spin" />
          Loading…
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-semibold mb-3">Sign in to view your profile</h2>
          <Link href="/login" className="text-sm text-[rgb(var(--accent))] hover:underline">
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

  async function handleUsernameSave() {
    setUsernameError(null);
    setUsernameSuccess(false);
    setUsernameLoading(true);
    try {
      await updateProfile(token, usernameValue);
      setProfile({ ...profile, username: usernameValue });
      setEditingUsername(false);
      setUsernameSuccess(true);
      setTimeout(() => setUsernameSuccess(false), 2000);
    } catch (err) {
      setUsernameError(err.message);
    } finally {
      setUsernameLoading(false);
    }
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
      setShowPassword(false);
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwLoading(false);
    }
  }

  const displayName = profile?.username || profile?.email?.split("@")[0] || "User";

  return (
    <main className="min-h-screen">
      <div className="h-1 bg-gradient-to-r from-[rgb(var(--accent))]/30 via-[rgb(var(--accent))]/10 to-transparent" />

      <div className="max-w-xl mx-auto px-6 xl:px-10 py-8">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors no-underline mb-10"
        >
          <ArrowLeft size={16} /> Back to overview
        </Link>

        {/* Profile header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 rounded-full bg-[rgb(var(--accent-soft))] flex items-center justify-center text-[rgb(var(--accent))]">
            <span className="text-xl font-bold">{displayName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">{displayName}</h1>
            <p className="text-sm text-[rgb(var(--muted))]">{profile?.email}</p>
          </div>
        </div>

        {/* Stats — compact row */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-10 p-4 rounded-lg border border-[rgb(var(--border))]">
            <div className="text-center">
              <div className="text-lg font-bold tabular-nums text-[rgb(var(--fg))]">{stats.total_trackers}</div>
              <div className="text-xs text-[rgb(var(--muted))]">Trackers</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold tabular-nums text-[rgb(var(--accent))]">{stats.active_trackers}</div>
              <div className="text-xs text-[rgb(var(--muted))]">Active</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold tabular-nums text-[rgb(var(--fg))]">{stats.total_views}</div>
              <div className="text-xs text-[rgb(var(--muted))]">Views</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold tabular-nums text-[rgb(var(--fg))]">{stats.total_data_points}</div>
              <div className="text-xs text-[rgb(var(--muted))]">Data pts</div>
            </div>
          </div>
        )}

        {/* Username section */}
        <section className="mb-6 p-5 rounded-lg border border-[rgb(var(--border))]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AtSign size={14} className="text-[rgb(var(--muted))]" />
              <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Username</h2>
            </div>
            {!editingUsername && (
              <button
                onClick={() => setEditingUsername(true)}
                className="text-xs text-[rgb(var(--accent))] hover:underline"
              >
                Edit
              </button>
            )}
          </div>

          {editingUsername ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={usernameValue}
                onChange={(e) => setUsernameValue(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--card))] focus:border-[rgb(var(--accent))] focus:ring-1 focus:ring-[rgb(var(--accent))]/30 outline-none transition-colors"
                placeholder="Choose a username"
                minLength={3}
                maxLength={32}
                autoFocus
              />
              <button
                onClick={handleUsernameSave}
                disabled={usernameLoading}
                className="px-3 py-2 text-sm font-medium rounded-md bg-[rgb(var(--accent))] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {usernameLoading ? "…" : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditingUsername(false);
                  setUsernameValue(profile?.username || "");
                  setUsernameError(null);
                }}
                className="px-3 py-2 text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">
              {profile?.username ? `@${profile.username}` : "No username set"}
            </p>
          )}

          {usernameError && (
            <div className="flex items-center gap-2 mt-2 text-xs text-[rgb(var(--danger))]">
              <AlertCircle size={12} />
              {usernameError}
            </div>
          )}
          {usernameSuccess && (
            <div className="flex items-center gap-2 mt-2 text-xs text-[rgb(var(--success))]">
              <Check size={12} />
              Username updated
            </div>
          )}
        </section>

        {/* Password section */}
        <section className="mb-6 p-5 rounded-lg border border-[rgb(var(--border))]">
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <Settings size={14} className="text-[rgb(var(--muted))]" />
              <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Change password</h2>
            </div>
            <svg
              width="12" height="12" viewBox="0 0 12 12" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              className={`text-[rgb(var(--muted))] transition-transform duration-200 ${showPassword ? "rotate-180" : ""}`}
            >
              <path d="M3 4.5L6 7.5L9 4.5" />
            </svg>
          </button>

          {showPassword && (
            <form onSubmit={handlePasswordChange} className="mt-4 space-y-3">
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--card))] focus:border-[rgb(var(--accent))] focus:ring-1 focus:ring-[rgb(var(--accent))]/30 outline-none transition-colors"
                placeholder="Current password"
                required
              />
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--card))] focus:border-[rgb(var(--accent))] focus:ring-1 focus:ring-[rgb(var(--accent))]/30 outline-none transition-colors"
                placeholder="New password"
                required
                minLength={8}
              />
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--card))] focus:border-[rgb(var(--accent))] focus:ring-1 focus:ring-[rgb(var(--accent))]/30 outline-none transition-colors"
                placeholder="Confirm new password"
                required
                minLength={8}
              />

              {pwError && (
                <div className="flex items-center gap-2 text-xs text-[rgb(var(--danger))]">
                  <AlertCircle size={12} />
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="flex items-center gap-2 text-xs text-[rgb(var(--success))]">
                  <Check size={12} />
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
          )}
        </section>

        {/* Logout — at bottom, separated */}
        <div className="pt-6 border-t border-[rgb(var(--border))]">
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--danger))] transition-colors"
          >
            <LogOut size={14} />
            Log out
          </button>
        </div>
      </div>
    </main>
  );
}
