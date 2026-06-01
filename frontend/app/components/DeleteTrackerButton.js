"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteTrackerAction } from "@/app/actions/trackers";

export default function DeleteTrackerButton({ id }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteTrackerAction(id);
    });
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-[rgb(var(--muted))]">Delete tracker?</span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Trash2 size={14} />
          )}
          Confirm
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[rgb(var(--muted))] border border-[rgb(var(--border))] hover:text-red-600 hover:border-red-500/40 transition-colors"
    >
      <Trash2 size={14} />
      Delete
    </button>
  );
}
