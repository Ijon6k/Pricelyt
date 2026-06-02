"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// Server-side only: talks to the API over the internal Docker network.
function getInternalBase() {
  return process.env.API_BASE_INTERNAL || "http://api:8080/api";
}

export async function deleteTrackerAction(id) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // Auth check: require JWT token
  if (!token) {
    throw new Error("Authentication required");
  }

  const res = await fetch(`${getInternalBase()}/trackers/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
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
