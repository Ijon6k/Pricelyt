import Link from "next/link"; // 1. Import component Link
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

        {/* --- SECTION 1: HEADER & RAW INFO --- */}
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
                tracker.status === "READY"
                  ? "bg-green-100 text-green-800"
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
                className="font-medium text-xs truncate"
                title={tracker.last_error_message}
              >
                {tracker.last_error_code || "None"}
              </span>
            </div>
          </div>
        </div>

        {/* --- SECTION 2: PRICE LOGS (TABEL) --- */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">
            Price History
          </h2>

          {!tracker.price_logs || tracker.price_logs.length === 0 ? (
            <p className="text-gray-500 italic">No price data recorded yet.</p>
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
      </div>
    </main>
  );
}
