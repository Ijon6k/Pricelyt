import Link from "next/link";
import {
  Eye,
  Hash,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Loader2,
  Clock,
} from "lucide-react";

export default function TrackerCard({ tracker }) {
  // 1. Safe Data Extraction
  const {
    id = "",
    keyword = "Unknown Item",
    status = "PENDING",
    created_at,
    view_count = 0,
    error_count = 0,
    price_logs = [],
  } = tracker || {};

  // 2. Cek apakah ada data harga terakhir
  const latestLog =
    price_logs.length > 0 ? price_logs[price_logs.length - 1] : null;
  const hasPrice = !!latestLog;

  // 3. Format Tanggal
  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

  // 4. Helper Warna Status (Sesuai request: PROCESS, PENDING, READY, ERROR)
  const getStatusConfig = (s) => {
    switch (s) {
      case "READY":
        return {
          style: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
          icon: null,
        };
      case "PROCESS":
        return {
          style: "bg-blue-500/10 text-blue-600 border-blue-500/20",
          icon: <Loader2 size={10} className="animate-spin mr-1" />,
        };
      case "PENDING":
        return {
          style: "bg-amber-500/10 text-amber-600 border-amber-500/20",
          icon: <Clock size={10} className="mr-1" />,
        };
      case "ERROR":
        return {
          style: "bg-red-500/10 text-red-600 border-red-500/20",
          icon: <AlertTriangle size={10} className="mr-1" />,
        };
      default:
        // Fallback style
        return {
          style: "bg-gray-500/10 text-gray-600 border-gray-500/20",
          icon: null,
        };
    }
  };

  const statusConfig = getStatusConfig(status);

  return (
    <Link href={`/trackers/${id}`} className="group block h-full">
      <div
        className="
          relative h-full flex flex-col
          bg-[rgb(var(--card))]
          border border-[rgb(var(--border))]
          rounded-2xl p-6
          transition-all duration-300 ease-out
          hover:shadow-xl hover:-translate-y-1 hover:border-[rgb(var(--accent))]
        "
      >
        {/* --- HEADER: Date & Status --- */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted))] font-medium">
            <Calendar size={12} />
            <span>{formattedDate}</span>
          </div>

          <span
            className={`
              flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider border uppercase
              ${statusConfig.style}
            `}
          >
            {statusConfig.icon}
            {status}
          </span>
        </div>

        {/* --- BODY: Keyword (Main Focus) --- */}
        <div className="mb-6 flex-grow">
          <h2 className="text-xl font-bold text-[rgb(var(--fg))] leading-snug group-hover:text-[rgb(var(--accent))] transition-colors line-clamp-2">
            {keyword}
          </h2>

          {/* Slot Harga */}
          <div className="mt-2">
            {hasPrice ? (
              <span className="text-2xl font-extrabold text-[rgb(var(--fg))] tracking-tight">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(latestLog.market_price)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-[rgb(var(--muted))] italic bg-[rgb(var(--bg))] px-2 py-1 rounded-md">
                {status === "PROCESS"
                  ? "Sedang mengambil data..."
                  : "Menunggu data harga..."}
              </span>
            )}
          </div>
        </div>

        {/* --- FOOTER: Metadata Grid --- */}
        <div className="pt-4 border-t border-[rgb(var(--border))]">
          <div className="flex items-center justify-between text-xs text-[rgb(var(--muted))]">
            {/* Left: ID & Views */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5" title={`ID: ${id}`}>
                <Hash size={12} />
                <span className="font-mono">
                  {id.slice(0, 4)}...{id.slice(-4)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye size={12} />
                <span>{view_count}</span>
              </div>
            </div>

            {/* Right: Error Indicator (Special Alert) or Arrow */}
            <div className="flex items-center gap-2">
              {error_count > 0 && status !== "ERROR" && (
                <div
                  className="flex items-center gap-1 text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded text-[10px] font-bold"
                  title="Pernah error sebelumnya"
                >
                  <AlertTriangle size={10} />
                  {error_count}
                </div>
              )}

              <div className="text-[rgb(var(--border))] group-hover:text-[rgb(var(--accent))] transition-colors">
                <ArrowUpRight size={18} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
