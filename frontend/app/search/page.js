"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react"; // 1. Import Suspense
import { searchTrackers, addTracker } from "@/app/lib/api";
import SearchBar from "@/app/components/SearchBar";
import TrackerCard from "@/app/components/TrackerCard";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const router = useRouter();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await searchTrackers(query);
        setResults(data.results || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query]);

  const handleAddTracker = async () => {
    setIsAdding(true);
    try {
      const newItem = await addTracker(query);
      router.push(`/trackers/${newItem.id}`);
    } catch (err) {
      alert("Gagal menambahkan tracker");
      setIsAdding(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-10 max-w-2xl mx-auto">
        <SearchBar />
      </div>

      <div className="mb-6">
        {query ? (
          <h1 className="text-xl font-bold text-gray-800">
            Hasil untuk <span className="text-blue-600">"{query}"</span>
          </h1>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-300">
              Mau cari apa hari ini?
            </h2>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      )}

      {!loading && query && (
        <div className="space-y-6">
          {results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map((item) => (
                <div key={item.id} className="h-full">
                  <TrackerCard tracker={item} />
                </div>
              ))}
            </div>
          )}

          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-gray-400 transition-colors">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {results.length === 0
                ? `Barang "${query}" tidak ditemukan.`
                : "Masih belum ketemu?"}
            </h3>
            <p className="text-gray-500 mb-6 text-sm">
              Tenang, kita bisa mulai melacak harga barang ini khusus buat kamu.
            </p>

            <button
              onClick={handleAddTracker}
              disabled={isAdding}
              className="bg-black text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              {isAdding ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Memproses...
                </span>
              ) : (
                `+ Lacak "${query}"`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={<div className="text-center py-20">Loading search...</div>}
    >
      <SearchContent />
    </Suspense>
  );
}
