"use client";

import { AuthProvider as Provider } from "../lib/AuthContext";

export default function AuthProvider({ children }) {
  return <Provider>{children}</Provider>;
}
