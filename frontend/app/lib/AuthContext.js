"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext(null);

function loadAuth() {
  if (typeof window === "undefined") return { token: null, user: null };
  const savedToken = localStorage.getItem("pricelyt_token");
  const savedUser = localStorage.getItem("pricelyt_user");
  let user = null;
  if (savedToken && savedUser) {
    try {
      user = JSON.parse(savedUser);
    } catch {
      localStorage.removeItem("pricelyt_token");
      localStorage.removeItem("pricelyt_user");
    }
  }
  return {
    token: savedToken && user ? savedToken : null,
    user,
  };
}

export function AuthProvider({ children }) {
  // Synchronous read from localStorage — no useEffect needed.
  const [state, setState] = useState(() => {
    const { token, user } = loadAuth();
    return { token, user };
  });

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem("pricelyt_token", newToken);
    localStorage.setItem("pricelyt_user", JSON.stringify(newUser));
    // Also set cookie for server actions
    document.cookie = `token=${newToken}; path=/; max-age=86400; SameSite=Lax`;
    setState({ token: newToken, user: newUser });
  }, []);

  const router = useRouter();
  const logout = useCallback(() => {
    localStorage.removeItem("pricelyt_token");
    localStorage.removeItem("pricelyt_user");
    document.cookie = "token=; path=/; max-age=0";
    setState({ token: null, user: null });
    router.push("/");
  }, [router]);

  const { token, user } = state;
  // No loading state — sync init means we always have the answer immediately.
  const loading = false;

  const authFetch = useCallback(async (url, options = {}) => {
    const headers = { ...options.headers };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      logout();
      return res;
    }
    return res;
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, authFetch, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
