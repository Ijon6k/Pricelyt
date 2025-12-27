import Link from "next/link";

export default function TrackerCard({ tracker }) {
  return (
    <Link href={`/trackers/${tracker.id}`}>
      <div
        className="
          cursor-pointer
          rounded-xl
          border
          border-gray-200
          p-4
          transition
          hover:border-black
          hover:shadow-sm
        "
      >
        <h2 className="text-lg font-semibold">{tracker.keyword}</h2>

        <div className="mt-1 text-sm text-gray-600">
          Status: {tracker.status}
        </div>

        <div className="mt-1 text-sm text-gray-600">
          Views: {tracker.view_count}
        </div>
      </div>
    </Link>
  );
}
