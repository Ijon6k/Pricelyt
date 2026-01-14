"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { searchTrackers, addTracker } from "@/app/lib/api";
import { Search, Loader2, ArrowRight, Plus } from "lucide-react";

export default function SearchBar({ initialValue = "" }) {
  const router = useRouter();
  const wrapperRef = useRef(null); // Ref untuk klik di luar dropdown

  const [query, setQuery] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // --- Logic 1: Debounce Search ---
  useEffect(() => {
    if (!query.trim()) {
      setSearchResult(null);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchTrackers(query);
        setSearchResult(data);
        setShowDropdown(true);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  // --- Logic 2: Close Dropdown on Click Outside ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // --- Logic 3: Handle Actions ---
  const handleSearch = () => {
    if (!query.trim()) return;
    setShowDropdown(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleCreateNew = async () => {
    setLoading(true);
    try {
      const item = await addTracker(query);
      router.push(`/trackers/${item.id}`);
    } catch (e) {
      alert("Gagal membuat tracker baru.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full z-50">
      {/* INPUT CONTAINER */}
      <div
        className="
          group flex items-center rounded-2xl overflow-hidden
          bg-[rgb(var(--card))] border border-[rgb(var(--border))]
          shadow-lg hover:shadow-xl hover:border-[rgb(var(--accent))]
          transition-all duration-300
        "
      >
        {/* Icon Kiri */}
        <div className="pl-6 text-[rgb(var(--muted))] group-focus-within:text-[rgb(var(--accent))] transition-colors">
          {loading ? (
            <Loader2 size={22} className="animate-spin" />
          ) : (
            <Search size={22} />
          )}
        </div>

        {/* Input Field */}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchResult) setShowDropdown(true);
          }}
          placeholder="Cari produk (misal: RTX 4070, MacBook Air M2)..."
          className="
            w-full bg-transparent px-4 py-5
            text-lg font-medium text-[rgb(var(--fg))] outline-none
            placeholder:text-[rgb(var(--muted))] placeholder:font-normal
          "
        />

        {/* Button Kanan */}
        <div className="pr-2">
          <button
            onClick={handleSearch}
            className="
                flex items-center gap-2 px-6 py-3 rounded-xl font-semibold tracking-wide
                bg-[rgb(var(--accent))] text-white
                hover:opacity-90 hover:scale-[1.02] active:scale-95
                transition-all duration-200
                "
          >
            <span>CARI</span>
          </button>
        </div>
      </div>

      {/* DROPDOWN RESULTS */}
      {showDropdown && searchResult && (
        <div
          className="
            absolute top-[calc(100%+12px)] left-0 right-0
            bg-[rgb(var(--card))]
            border border-[rgb(var(--border))]
            shadow-2xl rounded-2xl overflow-hidden
            animate-in fade-in slide-in-from-top-2
          "
        >
          {searchResult.results.length > 0 ? (
            <div>
              <div className="px-4 py-3 bg-[rgb(var(--bg))]/50 border-b border-[rgb(var(--border))] text-xs font-bold text-[rgb(var(--muted))] uppercase tracking-wider">
                Ditemukan di Database
              </div>
              <ul className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {searchResult.results.map((item) => (
                  <li
                    key={item.id}
                    className="border-b border-[rgb(var(--border))] last:border-none"
                  >
                    <button
                      onClick={() => router.push(`/trackers/${item.id}`)}
                      className="w-full px-6 py-4 text-left hover:bg-[rgb(var(--bg))] transition flex justify-between items-center group/item"
                    >
                      <div>
                        <div className="font-semibold text-[rgb(var(--fg))] group-hover/item:text-[rgb(var(--accent))] transition-colors">
                          {item.keyword}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded bg-[rgb(var(--border))] text-[rgb(var(--muted))] font-mono">
                            {item.status}
                          </span>
                        </div>
                      </div>
                      <ArrowRight
                        size={18}
                        className="text-[rgb(var(--muted))] group-hover/item:text-[rgb(var(--accent))]"
                      />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="p-2 bg-[rgb(var(--bg))]/30 border-t border-[rgb(var(--border))] text-center">
                <button
                  onClick={handleSearch}
                  className="text-xs font-semibold text-[rgb(var(--accent))] hover:underline"
                >
                  Lihat semua hasil
                </button>
              </div>
            </div>
          ) : (
            // EMPTY STATE DROPDOWN
            <div className="p-8 text-center">
              <p className="text-[rgb(var(--muted))] mb-4">
                Barang <strong>"{query}"</strong> belum dilacak.
              </p>
              <button
                onClick={handleCreateNew}
                className="
                  inline-flex items-center gap-2 bg-[rgb(var(--fg))] text-[rgb(var(--bg))]
                  px-6 py-3 rounded-xl font-semibold hover:opacity-80 transition shadow-lg
                "
              >
                <Plus size={18} />
                Lacak Barang Baru
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
