"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// Server-side only: talks to the API over the internal Docker network and
// holds the admin key in the server environment. The browser never sees the
// key — it only invokes this action.
function getInternalBase() {
  return process.env.API_BASE_INTERNAL || "http://api:8080/api";
}

export async function deleteTrackerAction(id) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // Auth check: rely on the API to verify the JWT. If there's no token at all,
  // we short-circuit here instead of making a round trip.
  if (!token) {
    throw new Error("Authentication required");
  }

  const res = await fetch(`${getInternalBase()}/trackers/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Admin-Key": process.env.ADMIN_KEY || "change-me",
    },
    cache: "no-store",
  });

  // 204 No Content is the success case for DELETE.
  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete tracker (HTTP ${res.status})`);
  }

  revalidatePath("/");
  redirect("/");
}
