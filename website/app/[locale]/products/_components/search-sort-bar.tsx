"use client";

import { Search, SlidersHorizontal } from "lucide-react";

interface SearchSortBarProps {
  dict: {
    search: { placeholder: string };
    sort: { label: string; newest: string; priceAsc: string; priceDesc: string };
  };
  search: string;
  onSearchChange: (value: string) => void;
  sort: string;
  onSortChange: (value: string) => void;
  onOpenFilters: () => void;
}

export function SearchSortBar({
  dict,
  search,
  onSearchChange,
  sort,
  onSortChange,
  onOpenFilters,
}: SearchSortBarProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 gap-3">
        {/* Mobile filter button */}
        <button
          onClick={onOpenFilters}
          className="flex items-center gap-2 rounded-md px-3 py-2 lg:hidden"
          style={{
            background: "var(--bg-tertiary)",
            border: "1px solid var(--bg-border)",
            color: "var(--white-dim)",
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-sm)",
          }}
        >
          <SlidersHorizontal size={16} />
        </button>

        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--white-faint)" }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={dict.search.placeholder}
            className="w-full outline-none transition-colors duration-300 focus:border-[var(--gold)]"
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--bg-border)",
              color: "var(--white)",
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-sm)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-2) var(--space-3) var(--space-2) var(--space-10)",
            }}
          />
        </div>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <span
          style={{
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-xs)",
            color: "var(--white-faint)",
            whiteSpace: "nowrap",
          }}
        >
          {dict.sort.label}
        </span>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          style={{
            background: "var(--bg-tertiary)",
            border: "1px solid var(--bg-border)",
            color: "var(--white)",
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-sm)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-2) var(--space-3)",
          }}
        >
          <option value="-created_at">{dict.sort.newest}</option>
          <option value="min_price">{dict.sort.priceAsc}</option>
          <option value="-min_price">{dict.sort.priceDesc}</option>
        </select>
      </div>
    </div>
  );
}
