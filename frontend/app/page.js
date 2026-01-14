import SearchBar from "./components/SearchBar";
import TrackerCard from "./components/TrackerCard";
import { fetchTrackers } from "./lib/api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let trackers = [];

  try {
    trackers = await fetchTrackers();
  } catch (error) {
    console.error("Gagal load trackers:", error);
  }

  return (
    <main className="min-h-screen">
      {/* HERO */}
      <section className="border-b border-[rgb(var(--border))] bg-[rgb(var(--bg))]">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
            border border-[rgb(var(--border))] bg-[rgb(var(--card))] mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs tracking-widest text-green-600">
              SYSTEM OPERATIONAL
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-6">
            Market <br />
            <span className="text-[rgb(var(--accent))]">Intelligence</span>
          </h1>

          <p className="text-[rgb(var(--muted))] text-lg mb-2">
            Harga historis dan analisis AI dalam satu dashboard futuristik.
          </p>

          <p className="italic text-[rgb(var(--muted))] mb-12">
            Tanpa gangguan. Tanpa noise.
          </p>

          <SearchBar />
        </div>
      </section>

      {/* TRACKERS */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-xl font-bold tracking-wider uppercase">
            Active Trackers
          </h2>
          <span className="text-sm text-[rgb(var(--muted))]">
            {trackers.length} monitored assets
          </span>
        </div>

        {trackers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {trackers.map((tracker) => (
              <TrackerCard key={tracker.id} tracker={tracker} />
            ))}
          </div>
        ) : (
          <div className="py-32 text-center border border-dashed border-[rgb(var(--border))] rounded-2xl bg-[rgb(var(--card))] shadow-sm">
            <p className="text-[rgb(var(--muted))]">
              Belum ada tracker. Mulai dengan mencari produk.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
