"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// Server-side only: talks to the API over the internal Docker network and
// holds the admin key in the server environment. The browser never sees the
// key — it only invokes this action.
function getInternalBase() {
  return process.env.API_BASE_INTERNAL || "http://api:8080/api";
}

export async function deleteTrackerAction(id) {
  const res = await fetch(`${getInternalBase()}/trackers/${id}`, {
    method: "DELETE",
    headers: {
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
