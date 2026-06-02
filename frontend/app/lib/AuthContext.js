"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem("pricelyt_token");
    const savedUser = localStorage.getItem("pricelyt_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("pricelyt_token");
        localStorage.removeItem("pricelyt_user");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem("pricelyt_token", newToken);
    localStorage.setItem("pricelyt_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("pricelyt_token");
    localStorage.removeItem("pricelyt_user");
    setToken(null);
    setUser(null);
    router.push("/");
  }, [router]);

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
