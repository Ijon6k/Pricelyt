import SearchBar from "./components/SearchBar";
import TrackerList from "./components/TrackerList";
import { fetchTrackers } from "./lib/api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let trackers = [];

  try {
    const data = await fetchTrackers();
    trackers = data || [];
  } catch (error) {
    console.error("Failed to load trackers:", error);
  }

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

      <section className="max-w-6xl mx-auto px-6 py-16">
        {trackers.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-[rgb(var(--border))] rounded-xl">
            <p className="text-[rgb(var(--muted))]">
              No trackers yet. Search a product to start.
            </p>
          </div>
        ) : (
          <TrackerList trackers={trackers} />
        )}
      </section>
    </main>
  );
}
