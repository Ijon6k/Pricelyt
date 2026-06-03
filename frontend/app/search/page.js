"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { searchTrackers, addTracker } from "@/app/lib/api";
import SearchBar from "@/app/components/SearchBar";
import TrackerRow from "@/app/components/TrackerRow";
import { SearchX, Loader2, Plus } from "lucide-react";

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
      alert("Failed to add tracker. Try again.");
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* SEARCH BAR */}
        <div className="mb-10 max-w-2xl mx-auto">
          <SearchBar initialValue={query || ""} />
        </div>

        <div className="max-w-4xl mx-auto">
          {/* TITLE */}
          <div className="mb-8">
            {query ? (
              <h1 className="text-2xl font-semibold tracking-tight">
                Results for{" "}
                <span className="text-[rgb(var(--accent))]">
                  &ldquo;{query}&rdquo;
                </span>
              </h1>
            ) : (
              <div className="text-center py-10">
                <h2 className="text-base text-[rgb(var(--muted))]">
                  What are you looking for?
                </h2>
              </div>
            )}
          </div>

          {/* LOADING */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={24} className="animate-spin text-[rgb(var(--accent))]" />
              <p className="text-sm text-[rgb(var(--muted))]">Searching&hellip;</p>
            </div>
          )}

          {/* RESULTS */}
          {!loading && query && (
            <div className="space-y-8">
              {results.length > 0 && (
                <div className="border-t border-[rgb(var(--border))]">
                  {results.map((item) => (
                    <TrackerRow key={item.id} tracker={item} />
                  ))}
                </div>
              )}

              {/* CTA */}
              <div className="border border-dashed border-[rgb(var(--border))] rounded-lg p-8 text-center">
                <div className="mx-auto w-10 h-10 bg-[rgb(var(--accent-soft))] rounded-full flex items-center justify-center mb-3">
                  {results.length === 0 ? (
                    <SearchX size={18} className="text-[rgb(var(--accent))]" />
                  ) : (
                    <Plus size={18} className="text-[rgb(var(--accent))]" />
                  )}
                </div>

                <h3 className="text-base font-semibold text-[rgb(var(--fg))] mb-1">
                  {results.length === 0
                    ? `"${query}" not found`
                    : "Not what you're after?"}
                </h3>
                <p className="text-sm text-[rgb(var(--muted))] mb-6 max-w-md mx-auto">
                  Create a new tracker to monitor this product&rsquo;s price
                  automatically.
                </p>

                <button
                  onClick={handleAddTracker}
                  disabled={isAdding}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[rgb(var(--accent))] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAdding ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating&hellip;
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Track &ldquo;{query}&rdquo;
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
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-[rgb(var(--muted))]" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
