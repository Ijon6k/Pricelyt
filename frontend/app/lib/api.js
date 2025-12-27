const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
console.log(API_BASE);
export async function fetchTrackers() {
  const res = await fetch(`${API_BASE}/trackers`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch trackers");
  return res.json();
}

export async function fetchTrackerDetail(id) {
  const res = await fetch(`${API_BASE}/trackers/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch tracker detail");
  return res.json();
}
