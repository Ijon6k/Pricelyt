import SearchBar from "./components/SearchBar";
import TrackerCard from "./components/TrackerCard";
import { fetchTrackers } from "./lib/api";

export const dynamic = "force-dynamic";
export default async function HomePage() {
  let trackers = [];
  try {
    trackers = await fetchTrackers();
  } catch (error) {
    console.error("Gagal load trackers di home:", error);
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
            Pricelyt ⚡
          </h1>
          <p className="text-gray-500 mb-8 text-lg">
            Pantau harga barang impianmu secara real-time.
          </p>
          <SearchBar />
        </div>
      </div>

      {/* List Trackers */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Daftar Pantauan ({trackers?.length ?? 0})
          </h2>
        </div>

        {trackers?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trackers.map((tracker) => (
              <TrackerCard key={tracker.id} tracker={tracker} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500">Belum ada barang yang dilacak.</p>
          </div>
        )}
      </div>
    </main>
  );
}
