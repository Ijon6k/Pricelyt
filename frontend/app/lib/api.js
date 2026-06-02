// Resolve the API base depending on where the code runs.
//
// - Server-side (SSR inside the container): talk to the API directly over the
//   internal Docker network. `localhost` here would mean the frontend
//   container itself, not nginx, so we use the service hostname.
// - Client-side (browser): use a relative path so requests hit whatever origin
//   the page was served from. nginx proxies `/api` to the Go API, so the
//   browser never deals with cross-origin requests.
function getBaseUrl() {
  if (typeof window === "undefined") {
    return process.env.API_BASE_INTERNAL || "http://api:8080/api";
  }
  return process.env.NEXT_PUBLIC_API_BASE || "/api";
}

export async function fetchTrackers() {
  const res = await fetch(`${getBaseUrl()}/trackers`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch trackers");
  return res.json();
}

export async function fetchTrackerDetail(id) {
  const res = await fetch(`${getBaseUrl()}/trackers/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch tracker detail");
  return res.json();
}

export async function searchTrackers(keyword) {
  const res = await fetch(
    `${getBaseUrl()}/trackers?q=${encodeURIComponent(keyword)}`,
    {
      cache: "no-store",
    },
  );
  if (!res.ok) throw new Error("Failed to search");
  return res.json();
}

export async function addTracker(keyword, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${getBaseUrl()}/trackers`, {
    method: "POST",
    headers,
    body: JSON.stringify({ keyword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to add tracker" }));
    throw new Error(err.error || "Failed to add tracker");
  }
  return res.json();
}

export async function registerUser(email, password) {
  const res = await fetch(`${getBaseUrl()}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Registration failed" }));
    throw new Error(err.error || "Registration failed");
  }
  return res.json();
}

export async function loginUser(email, password) {
  const res = await fetch(`${getBaseUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Login failed" }));
    throw new Error(err.error || "Login failed");
  }
  return res.json();
}
