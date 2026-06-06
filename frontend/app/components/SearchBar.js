"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { searchTrackers, addTracker } from "@/app/lib/api";
import { useAuth } from "@/app/lib/AuthContext";
import { Search, Loader2, ArrowRight, Plus } from "lucide-react";

export default function SearchBar({ initialValue = "" }) {
  const router = useRouter();
  const wrapperRef = useRef(null);
  const { token } = useAuth();

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
      const item = await addTracker(query, token);
      router.push(`/trackers/${item.id}`);
    } catch (e) {
      alert(e.message || "Failed to create tracker. Log in first.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full z-50 text-left">
      {/* INPUT */}
      <div className="flex items-center rounded-lg bg-[rgb(var(--card))] border border-[rgb(var(--border))] focus-within:border-[rgb(var(--accent))] transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
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
          className="w-full bg-transparent px-3 py-[11px] text-sm sm:text-[15px] text-[rgb(var(--fg))] outline-none placeholder:text-[rgb(var(--muted-lighter))]"
        />

        <div className="pr-2">
          <button
            onClick={handleSearch}
            className="px-4 py-[7px] rounded-md text-sm font-medium bg-[rgb(var(--accent))] text-white hover:opacity-90 active:opacity-80 transition-opacity"
          >
            Search
          </button>
        </div>
      </div>

      {/* DROPDOWN */}
      {showDropdown && searchResult && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          {searchResult.results.length > 0 ? (
            <div>
              <div className="px-4 py-2.5 border-b border-[rgb(var(--border))] text-[11px] font-medium text-[rgb(var(--muted))] uppercase tracking-[0.1em]">
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
                      className="w-full px-4 py-3 text-left hover:bg-[rgb(var(--card-hover))] transition-colors flex justify-between items-center group"
                    >
                      <div>
                        <div className="font-medium text-[13px] text-[rgb(var(--fg))]">
                          {item.keyword}
                        </div>
                        <span className="text-[11px] text-[rgb(var(--muted-lighter))]">
                          {item.status}
                        </span>
                      </div>
                      <ArrowRight
                        size={15}
                        className="text-[rgb(var(--muted-lighter))] group-hover:text-[rgb(var(--accent))] transition-colors"
                      />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="p-2 border-t border-[rgb(var(--border))] text-center">
                <button
                  onClick={handleSearch}
                  className="text-[11px] font-medium text-[rgb(var(--accent))] hover:underline"
                >
                  See all results &rarr;
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
                className="inline-flex items-center gap-2 bg-[rgb(var(--accent))] text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
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
