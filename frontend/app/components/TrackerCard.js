// app/components/TrackerCard.js
import Link from "next/link";
import { Eye, Activity, AlertCircle, CheckCircle, Clock } from "lucide-react";

export default function TrackerCard({ tracker }) {
  // Helper untuk warna status
  const getStatusStyle = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "ERROR":
        return "bg-red-50 text-red-700 border-red-200";
      case "SUCCESS":
      case "READY":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  // Helper untuk icon status
  const getStatusIcon = (status) => {
    if (status === "ERROR") return <AlertCircle size={14} />;
    if (status === "PENDING") return <Clock size={14} />;
    return <CheckCircle size={14} />;
  };

  return (
    <Link href={`/trackers/${tracker.id}`} className="block h-full">
      <div
        className="
          group relative flex flex-col justify-between h-full
          rounded-xl border border-gray-200 bg-white p-5
          transition-all duration-200 ease-in-out
          hover:border-black hover:shadow-md
        "
      >
        {/* Bagian Atas: Judul */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
            {tracker.keyword}
          </h2>
        </div>

        {/* Bagian Bawah: Metadata */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
          {/* Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${getStatusStyle(tracker.status)}`}
          >
            {getStatusIcon(tracker.status)}
            <span>{tracker.status}</span>
          </div>

          {/* View Count */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <Eye size={16} className="text-gray-400" />
            <span>{tracker.view_count || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
