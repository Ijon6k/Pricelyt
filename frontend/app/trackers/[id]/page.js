import Link from "next/link";
import { fetchTrackerDetail } from "@/app/lib/api";

export default async function TrackerDetailPage({ params }) {
  const { id } = await params;
  const tracker = await fetchTrackerDetail(id);

  const formatCurrency = (number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(number);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "medium",
    });
  };

  // Logic: Cek apakah tracker punya error history terakhir
  const hasError = !!tracker.last_error_code;

  return (
    <main className="bg-gray-50 min-h-screen py-8">
      <div className="mx-auto max-w-5xl px-4 space-y-8">
        {/* --- 2. BUTTON BACK TO HOME --- */}
        <div>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>

        {/* --- SECTION 1: HEADER & RAW INFO (Tetap Ditampilkan) --- */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {tracker.keyword}
              </h1>
              <p className="text-xs text-gray-400 font-mono mt-1">
                ID: {tracker.id}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                tracker.status === "READY" || tracker.status === "SUCCESS"
                  ? "bg-green-100 text-green-800"
                  : tracker.status === "ERROR"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {tracker.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <span className="block text-gray-500">Views</span>
              <span className="font-medium text-lg">{tracker.view_count}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <span className="block text-gray-500">Created At</span>
              <span className="font-medium">
                {formatDate(tracker.created_at)}
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <span className="block text-gray-500">Errors</span>
              <span className="font-medium text-red-600">
                {tracker.error_count}
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <span className="block text-gray-500">Last Error</span>
              <span
                className="font-medium text-xs truncate text-red-500"
                title={tracker.last_error_message}
              >
                {tracker.last_error_code || "None"}
              </span>
            </div>
          </div>
        </div>

        {/* --- LOGIC PERCABANGAN ERROR --- */}
        {hasError ? (
          // 🛑 TAMPILAN JIKA ERROR (Hanya Pesan Gagal)
          <div className="bg-red-50 border border-red-200 rounded-lg p-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Gagal menscrape data ini
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Sistem mendeteksi adanya kesalahan saat mencoba mengambil data
              terbaru.
            </p>
            <div className="mt-4 p-3 bg-white border border-red-100 rounded inline-block text-left max-w-lg">
              <p className="text-xs font-mono text-red-600 break-words">
                <strong>Code:</strong> {tracker.last_error_code}
                <br />
                <strong>Message:</strong> {tracker.last_error_message}
              </p>
            </div>
          </div>
        ) : (
          // ✅ TAMPILAN NORMAL (Price & News Logs)
          <>
            {/* --- SECTION 2: PRICE LOGS (TABEL) --- */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">
                Price History
              </h2>

              {!tracker.price_logs || tracker.price_logs.length === 0 ? (
                <p className="text-gray-500 italic">
                  No price data recorded yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium">
                      <tr>
                        <th className="px-4 py-2">Scraped At</th>
                        <th className="px-4 py-2">Market Price</th>
                        <th className="px-4 py-2">Range (Min - Max)</th>
                        <th className="px-4 py-2">Samples</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tracker.price_logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                            {formatDate(log.scraped_at)}
                          </td>
                          <td className="px-4 py-2 font-medium text-gray-900">
                            {formatCurrency(log.market_price)}
                          </td>
                          <td className="px-4 py-2 text-gray-600">
                            {formatCurrency(log.min_price)} -{" "}
                            {formatCurrency(log.max_price)}
                          </td>
                          <td className="px-4 py-2 text-gray-600">
                            {log.sample_count} items
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* --- SECTION 3: NEWS LOGS (LIST) --- */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-xl font-semibold">News Feed</h2>
                <span className="text-sm text-gray-500">
                  Total: {tracker.news_logs?.length || 0}
                </span>
              </div>

              {!tracker.news_logs || tracker.news_logs.length === 0 ? (
                <p className="text-gray-500 italic">No news scraped yet.</p>
              ) : (
                <ul className="space-y-4">
                  {tracker.news_logs.map((news) => (
                    <li
                      key={news.id}
                      className="flex flex-col sm:flex-row gap-4 p-3 border rounded hover:border-blue-300 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {news.is_blocked && (
                            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded">
                              BLOCKED
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatDate(news.scraped_at)}
                          </span>
                        </div>
                        <a
                          href={news.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:underline line-clamp-2"
                        >
                          {news.title || "No Title (Error parsing?)"}
                        </a>
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {news.source_url}
                        </p>

                        <p className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded line-clamp-3 font-mono">
                          {news.content}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
