import SearchBar from "./components/SearchBar";
import TrackerCard from "./components/TrackerCard";
import { fetchTrackers } from "./lib/api";

export default async function HomePage() {
  const trackers = await fetchTrackers();

  return (
    <main className=" bg-white mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Pricelyt</h1>

      <div className="mb-6">
        <SearchBar />
      </div>

      <div className="space-y-3 flex  flex-col gap-4">
        {trackers.map((tracker) => (
          <TrackerCard key={tracker.id} tracker={tracker} />
        ))}
      </div>
    </main>
  );
}
