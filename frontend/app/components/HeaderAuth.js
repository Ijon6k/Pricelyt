"use client";

import dynamic from "next/dynamic";

const AuthNav = dynamic(() => import("./AuthNav"), {
  ssr: false,
  loading: () => null,
});

export default function HeaderAuth() {
  return <AuthNav />;
}
