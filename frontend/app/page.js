import SearchBar from "./components/SearchBar";
import TrackerCard from "./components/TrackerCard";
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

            {/* TRACKERS */}
            <section className="max-w-6xl mx-auto px-6 py-16">
                <div className="flex items-baseline justify-between mb-8">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                        Active trackers
                    </h2>
                    <span className="text-sm text-[rgb(var(--muted))]">
                        {trackers?.length || 0} tracked
                    </span>
                </div>

                {trackers && trackers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {trackers.map((tracker) => (
                            <TrackerCard key={tracker.id} tracker={tracker} />
                        ))}
                    </div>
                ) : (
                    <div className="py-24 text-center border border-dashed border-[rgb(var(--border))] rounded-xl">
                        <p className="text-[rgb(var(--muted))]">
                            No trackers yet. Search a product to start.
                        </p>
                    </div>
                )}
            </section>
        </main>
    );
}
