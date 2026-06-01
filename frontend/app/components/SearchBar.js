"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { searchTrackers, addTracker } from "@/app/lib/api";
import { Search, Loader2, ArrowRight, Plus } from "lucide-react";

export default function SearchBar({ initialValue = "" }) {
  const router = useRouter();
  const wrapperRef = useRef(null);

  const [query, setQuery] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Debounced search-as-you-type.
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

  // Close dropdown when clicking outside.
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

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
      alert("Failed to create tracker.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full z-50 text-left">
      {/* INPUT */}
      <div className="flex items-center rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] focus-within:border-[rgb(var(--accent))] transition-colors">
        <div className="pl-4 text-[rgb(var(--muted))]">
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Search size={18} />
          )}
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchResult) setShowDropdown(true);
          }}
          placeholder="Search a product, e.g. RTX 4070, MacBook Air M2"
          className="w-full bg-transparent px-3 py-3.5 text-base text-[rgb(var(--fg))] outline-none placeholder:text-[rgb(var(--muted))]"
        />

        <div className="pr-2">
          <button
            onClick={handleSearch}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[rgb(var(--accent))] text-white hover:opacity-90 active:opacity-80 transition-opacity"
          >
            Search
          </button>
        </div>
      </div>

      {/* DROPDOWN */}
      {showDropdown && searchResult && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl overflow-hidden shadow-sm">
          {searchResult.results.length > 0 ? (
            <div>
              <div className="px-4 py-2.5 border-b border-[rgb(var(--border))] text-xs font-medium text-[rgb(var(--muted))] uppercase tracking-wider">
                Found in database
              </div>
              <ul className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {searchResult.results.map((item) => (
                  <li
                    key={item.id}
                    className="border-b border-[rgb(var(--border))] last:border-none"
                  >
                    <button
                      onClick={() => router.push(`/trackers/${item.id}`)}
                      className="w-full px-4 py-3 text-left hover:bg-[rgb(var(--bg))] transition-colors flex justify-between items-center group"
                    >
                      <div>
                        <div className="font-medium text-[rgb(var(--fg))]">
                          {item.keyword}
                        </div>
                        <span className="text-xs text-[rgb(var(--muted))]">
                          {item.status}
                        </span>
                      </div>
                      <ArrowRight
                        size={16}
                        className="text-[rgb(var(--muted))] group-hover:text-[rgb(var(--accent))] transition-colors"
                      />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="p-2 border-t border-[rgb(var(--border))] text-center">
                <button
                  onClick={handleSearch}
                  className="text-xs font-medium text-[rgb(var(--accent))] hover:underline"
                >
                  See all results
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-sm text-[rgb(var(--muted))] mb-4">
                <strong className="text-[rgb(var(--fg))]">
                  &ldquo;{query}&rdquo;
                </strong>{" "}
                isn&rsquo;t tracked yet.
              </p>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 bg-[rgb(var(--accent))] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Plus size={16} />
                Track this product
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
