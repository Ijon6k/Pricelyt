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

export async function registerUser(email, password, username) {
  const body = { email, password };
  if (username) body.username = username;
  const res = await fetch(`${getBaseUrl()}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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

// --- Profile ---

export async function fetchProfile(token) {
  const res = await fetch(`${getBaseUrl()}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

export async function updateProfile(token, username) {
  const res = await fetch(`${getBaseUrl()}/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to update profile" }));
    throw new Error(err.error || "Failed to update profile");
  }
  return res.json();
}

export async function fetchProfileStats(token) {
  const res = await fetch(`${getBaseUrl()}/profile/stats`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function fetchProfileTrackers(token) {
  const res = await fetch(`${getBaseUrl()}/profile/trackers`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch trackers");
  return res.json();
}

export async function changePassword(token, currentPassword, newPassword) {
  const res = await fetch(`${getBaseUrl()}/profile/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to change password" }));
    throw new Error(err.error || "Failed to change password");
  }
  return res.json();
}

// --- Share ---

export async function createShareLink(trackerId, token) {
  const res = await fetch(`${getBaseUrl()}/trackers/${trackerId}/share`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to create share link" }));
    throw new Error(err.error || "Failed to create share link");
  }
  return res.json();
}

export async function getShareLink(trackerId, token) {
  const res = await fetch(`${getBaseUrl()}/trackers/${trackerId}/share`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch share link");
  return res.json();
}

export async function deleteShareLink(trackerId, token) {
  const res = await fetch(`${getBaseUrl()}/trackers/${trackerId}/share`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete share link");
}

export async function fetchSharedTracker(shareToken) {
  const res = await fetch(`${getBaseUrl()}/share/${shareToken}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Shared tracker not found");
  return res.json();
}

// --- Queue ---

export async function fetchQueue() {
  const res = await fetch(`${getBaseUrl()}/queue`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch queue");
  return res.json();
}

// --- Watchlist ---

export async function fetchWatchlist(token) {
  const res = await fetch(`${getBaseUrl()}/watchlist`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch watchlist");
  return res.json();
}

export async function addToWatchlist(trackerId, token) {
  const res = await fetch(`${getBaseUrl()}/watchlist/${trackerId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to add to watchlist");
  return res.json();
}

export async function removeFromWatchlist(trackerId, token) {
  const res = await fetch(`${getBaseUrl()}/watchlist/${trackerId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to remove from watchlist");
}

// --- Summary ---

export async function generateSummary(trackerId, token) {
  const res = await fetch(`${getBaseUrl()}/trackers/${trackerId}/summary`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to generate summary" }));
    throw new Error(err.error || "Failed to generate summary");
  }
  return res.json();
}
