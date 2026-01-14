import Link from "next/link";
import { fetchTrackerDetail } from "@/app/lib/api";
import TrackerDashboard from "@/app/components/TrackerDashboard";
import { ArrowLeft, AlertTriangle, Eye, Calendar } from "lucide-react";

export default async function TrackerDetailPage({ params }) {
  const { id } = await params;
  const tracker = await fetchTrackerDetail(id);

  // -- Helpers --
  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("en-US", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "-";

  const hasError = !!tracker.last_error_code;

  // -- Status Badge Helper --
  const getStatusBadge = (status) => {
    const styles = {
      READY: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      PROCESS: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      ERROR: "bg-red-500/10 text-red-600 border-red-500/20",
    };
    return styles[status] || styles.PENDING;
  };

  return (
    <main className="min-h-screen py-8 px-4 md:px-8 bg-[rgb(var(--bg))] transition-colors duration-300">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* --- 1. HEADER SECTION --- */}
        <div className="flex flex-col gap-6">
          <Link
            href="/"
            className="w-fit inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))] transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </Link>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-6 border-b border-[rgb(var(--border))]">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border uppercase ${getStatusBadge(tracker.status)}`}
                >
                  {tracker.status}
                </span>
                <span className="font-mono text-xs text-[rgb(var(--muted))]">
                  ID: {tracker.id}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-[rgb(var(--fg))] tracking-tight capitalize">
                {tracker.keyword}
              </h1>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-[rgb(var(--fg))]">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-[rgb(var(--muted))] uppercase tracking-wider mb-1">
                  Total Views
                </span>
                <div className="flex items-center gap-2 text-xl font-bold">
                  <Eye size={18} className="text-[rgb(var(--accent))]" />
                  {tracker.view_count}
                </div>
              </div>
              <div className="w-px h-8 bg-[rgb(var(--border))]"></div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-[rgb(var(--muted))] uppercase tracking-wider mb-1">
                  Created At
                </span>
                <div className="flex items-center gap-2 text-lg font-medium">
                  <Calendar size={18} className="text-[rgb(var(--muted))]" />
                  {formatDate(tracker.created_at)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- 2. ERROR BANNER (Conditional) --- */}
        {hasError && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 flex gap-4 items-center animate-in fade-in slide-in-from-top-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-800 dark:text-red-400">
                Scraping Error Detected
              </h3>
              <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">
                {tracker.last_error_message} (Code: {tracker.last_error_code})
              </p>
            </div>
          </div>
        )}

        {/* --- 3. MAIN DASHBOARD --- */}
        <TrackerDashboard tracker={tracker} />
      </div>
    </main>
  );
}
