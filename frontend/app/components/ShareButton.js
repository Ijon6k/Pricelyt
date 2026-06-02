"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../lib/AuthContext";
import { createShareLink, getShareLink, deleteShareLink } from "../lib/api";
import { Share2, Link2, Trash2, Check, Copy, ExternalLink } from "lucide-react";

export default function ShareButton({ trackerId }) {
  const { token } = useAuth();
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if share link exists on mount
  useEffect(() => {
    if (!token || !trackerId) return;

    async function checkShare() {
      try {
        const data = await getShareLink(trackerId, token);
        if (data.shared) {
          setShareData(data);
        }
      } catch {
        // No share link or error — that's fine
      } finally {
        setChecking(false);
      }
    }
    checkShare();
  }, [trackerId, token]);

  if (!token) return null;
  if (checking) return null;

  async function handleCreate() {
    setLoading(true);
    try {
      const data = await createShareLink(trackerId, token);
      setShareData(data);
    } catch (err) {
      console.error("Failed to create share link:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteShareLink(trackerId, token);
      setShareData(null);
    } catch (err) {
      console.error("Failed to delete share link:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!shareData?.token) return;
    const url = `${window.location.origin}/s/${shareData.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (shareData?.shared) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
          <Link2 size={12} className="text-[rgb(var(--accent))]" />
          <span className="text-[rgb(var(--muted))]">Public link active</span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md border border-[rgb(var(--border))] hover:bg-[rgb(var(--card-hover))] transition-colors"
          title="Copy link"
        >
          {copied ? (
            <Check size={14} className="text-[rgb(var(--success))]" />
          ) : (
            <Copy size={14} className="text-[rgb(var(--muted))]" />
          )}
        </button>
        <a
          href={`/s/${shareData.token}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-md border border-[rgb(var(--border))] hover:bg-[rgb(var(--card-hover))] transition-colors"
          title="Open public page"
        >
          <ExternalLink size={14} className="text-[rgb(var(--muted))]" />
        </a>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="p-1.5 rounded-md border border-[rgb(var(--border))] hover:bg-[rgb(var(--danger))]/10 hover:border-[rgb(var(--danger))]/30 transition-colors"
          title="Remove share link"
        >
          <Trash2 size={14} className="text-[rgb(var(--danger))]" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[rgb(var(--border))] hover:bg-[rgb(var(--card-hover))] transition-colors text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
    >
      <Share2 size={14} />
      {loading ? "Creating…" : "Share"}
    </button>
  );
}
