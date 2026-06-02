import SearchBar from "./components/SearchBar";
import TrackerCard from "./components/TrackerCard";
import { fetchTrackers } from "./lib/api";
import { Loader2, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

const IN_PROGRESS_STATUSES = ["PENDING", "PROCESSING", "ERROR"];
const TRACKED_STATUSES = ["READY"];

export default async function HomePage() {
  let trackers = [];

  try {
    const data = await fetchTrackers();
    trackers = data || [];
  } catch (error) {
    console.error("Failed to load trackers:", error);
  }

  const inProgress = trackers.filter((t) =>
    IN_PROGRESS_STATUSES.includes(t.status)
  );
  const tracked = trackers.filter((t) =>
    TRACKED_STATUSES.includes(t.status)
  );

  return (
    <main className="min-h-screen">
      {/* HERO */}
      <section className="border-b border-[rgb(var(--border))]">
        <div className="max-w-3xl mx-auto px-6 pt-32 pb-20 text-center">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            Track any product&rsquo;s price over time
          </h1>
          <p className="text-[rgb(var(--muted))] text-lg mb-10 max-w-xl mx-auto">
            Search a product, and Pricelyt monitors its market price
            and related news automatically.
          </p>
          <SearchBar />
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-16 space-y-12">
        {/* IN PROGRESS SECTION */}
        {inProgress.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between mb-6">
              <div className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-[rgb(var(--muted))]" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                  In progress
                </h2>
              </div>
              <span className="text-sm text-[rgb(var(--muted))]">
                {inProgress.length} {inProgress.length === 1 ? "tracker" : "trackers"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {inProgress.map((tracker) => (
                <TrackerCard key={tracker.id} tracker={tracker} />
              ))}
            </div>
          </section>
        )}

        {/* TRACKED SECTION */}
        <section>
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
              Tracked
            </h2>
            <span className="text-sm text-[rgb(var(--muted))]">
              {tracked.length} {tracked.length === 1 ? "tracker" : "trackers"}
            </span>
          </div>

          {tracked.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {tracked.map((tracker) => (
                <TrackerCard key={tracker.id} tracker={tracker} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center border border-dashed border-[rgb(var(--border))] rounded-xl">
              <p className="text-[rgb(var(--muted))]">
                {trackers.length === 0
                  ? "No trackers yet. Search a product to start."
                  : "No active trackers yet. New trackers will appear here once data is collected."}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
