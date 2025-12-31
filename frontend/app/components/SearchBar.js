"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { searchTrackers, addTracker } from "@/app/lib/api";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // debounce
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
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  // handle enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      // CASE A: Search box kosong
      if (!query.trim()) return;

      // CASE B: ke searchpage
      if (!searchResult) {
        router.push(`/search?q=${encodeURIComponent(query)}`);
        setShowDropdown(false);
        return;
      }

      // CASE C: EXACT
      if (
        searchResult.match_type === "EXACT" &&
        searchResult.results.length > 0
      ) {
        router.push(`/trackers/${searchResult.results[0].id}`);
        setShowDropdown(false);
      }
      // CASE D: Partial / None
      else {
        router.push(`/search?q=${encodeURIComponent(query)}`);
        setShowDropdown(false);
      }
    }
  };

  // add tracker dropdown
  const handleAddTracker = async () => {
    setLoading(true);
    try {
      const newItem = await addTracker(query);
      router.push(`/trackers/${newItem.id}`);
      setShowDropdown(false);
    } catch (err) {
      alert("Gagal menambah tracker");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-lg mx-auto z-50">
      {/* INPUT SEARCH */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchResult) setShowDropdown(true);
          }}
          placeholder="Cari barang (misal: RTX 3060)..."
          className="
            w-full rounded-lg border border-gray-300 px-4 py-3 pl-10
            focus:border-black focus:outline-none shadow-sm transition
          "
        />
        <div className="absolute left-3 top-3.5 text-gray-400">
          {loading ? (
            <span className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full block"></span>
          ) : (
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          )}
        </div>
      </div>

      {/* DROPDOWN RESULT  */}
      {showDropdown && searchResult && (
        <div className="absolute top-14 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          {/* LIST BARANG (PARTIAL) */}
          {searchResult.results.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto">
              {searchResult.results.map((item) => (
                <li
                  key={item.id}
                  className="border-b last:border-none border-gray-100"
                >
                  <button
                    onClick={() => {
                      router.push(`/trackers/${item.id}`);
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex justify-between items-center group"
                  >
                    <div>
                      <span className="font-medium text-gray-800 group-hover:text-black">
                        {item.keyword}
                      </span>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Status: {item.status}
                      </div>
                    </div>
                    <span className="text-gray-300 group-hover:text-gray-600">
                      →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            // NOT FOUND STATE DI DROPDOWN
            <div className="p-4 text-center">
              <p className="text-gray-500 mb-3 text-sm">
                Barang <strong>"{query}"</strong> tidak ditemukan.
              </p>
              <button
                onClick={handleAddTracker}
                className="w-full bg-black text-white py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition"
              >
                + Tambah Tracker Baru
              </button>
            </div>
          )}

          {/* FOOTER DROPDOWN (Link ke Search Page) */}
          {searchResult.match_type === "PARTIAL" && (
            <div className="bg-gray-50 p-3 border-t text-center">
              <button
                onClick={() => {
                  router.push(`/search?q=${encodeURIComponent(query)}`);
                  setShowDropdown(false);
                }}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Lihat semua hasil untuk "{query}"
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay transparan (Klik luar buat nutup dropdown) */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
    </div>
  );
}
