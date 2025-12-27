import { fetchTrackerDetail } from "@/app/lib/api";

export default async function TrackerDetailPage({ params }) {
  const { id } = await params;
  const tracker = await fetchTrackerDetail(id);

  return (
    <main className="bg-white mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">{tracker.keyword}</h1>

      <div className="mt-4 space-y-2 text-gray-700">
        <p>Status: {tracker.status}</p>
        <p>Views: {tracker.view_count}</p>
        <p>Created at: {new Date(tracker.created_at).toLocaleString()}</p>
      </div>
    </main>
  );
}
