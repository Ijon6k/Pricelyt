"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { searchTrackers, addTracker } from "@/app/lib/api";
import SearchBar from "@/app/components/SearchBar";
import TrackerCard from "@/app/components/TrackerCard";
import { ArrowLeft, SearchX, Loader2, Plus } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const router = useRouter();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Fetch Data saat query berubah
  useEffect(() => {
    if (!query) {
      setResults([]);
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

  // Handle Add Tracker jika barang tidak ditemukan
  const handleAddTracker = async () => {
    setIsAdding(true);
    try {
      const newItem = await addTracker(query);
      router.push(`/trackers/${newItem.id}`);
    } catch (err) {
      alert("Gagal menambahkan tracker. Coba lagi nanti.");
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* --- HEADER: Back Button --- */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors font-medium px-3 py-2 rounded-lg hover:bg-[rgb(var(--card))]"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* --- SEARCH BAR SECTION --- */}
        <div className="mb-12 max-w-3xl mx-auto">
          <SearchBar initialValue={query || ""} />
        </div>

        {/* --- CONTENT AREA --- */}
        <div className="max-w-5xl mx-auto">
          {/* 1. Title State */}
          <div className="mb-8 text-center md:text-left">
            {query ? (
              <h1 className="text-2xl font-bold">
                Hasil pencarian untuk{" "}
                <span className="text-[rgb(var(--accent))]">"{query}"</span>
              </h1>
            ) : (
              <div className="text-center py-10 opacity-50">
                <h2 className="text-xl font-medium">
                  Mau cari barang apa hari ini?
                </h2>
              </div>
            )}
          </div>

          {/* 2. Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2
                size={40}
                className="animate-spin text-[rgb(var(--accent))]"
              />
              <p className="text-[rgb(var(--muted))]">Mencari di database...</p>
            </div>
          )}

          {/* 3. Results State */}
          {!loading && query && (
            <div className="space-y-10">
              {/* Grid Result */}
              {results.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.map((item) => (
                    <div key={item.id} className="h-full">
                      <TrackerCard tracker={item} />
                    </div>
                  ))}
                </div>
              )}

              {/* Not Found / Call to Action Card */}
              <div
                className="
                bg-[rgb(var(--card))] border border-dashed border-[rgb(var(--border))]
                rounded-2xl p-10 text-center transition-all hover:border-[rgb(var(--accent))]
              "
              >
                <div className="mx-auto w-16 h-16 bg-[rgb(var(--bg))] rounded-full flex items-center justify-center mb-4 text-[rgb(var(--muted))]">
                  {results.length === 0 ? (
                    <SearchX size={32} />
                  ) : (
                    <Plus size={32} />
                  )}
                </div>

                <h3 className="text-lg font-bold text-[rgb(var(--fg))] mb-2">
                  {results.length === 0
                    ? `Barang "${query}" tidak ditemukan.`
                    : "Bukan barang yang kamu cari?"}
                </h3>
                <p className="text-[rgb(var(--muted))] mb-8 max-w-md mx-auto text-sm">
                  Jangan khawatir. Kita bisa membuat tracker baru khusus untuk
                  memantau harga barang ini secara real-time.
                </p>

                <button
                  onClick={handleAddTracker}
                  disabled={isAdding}
                  className="
                    inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white
                    bg-[rgb(var(--accent))] hover:opacity-90 transition-all shadow-lg shadow-blue-500/20
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {isAdding ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Creating Tracker...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Buat Tracker "{query}"
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[rgb(var(--bg))] flex items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
