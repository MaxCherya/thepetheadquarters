"use client";

import { Search, SlidersHorizontal, LayoutGrid, List } from "lucide-react";

type ViewMode = "grid" | "list";

interface SearchSortBarProps {
  dict: {
    search: { placeholder: string };
    sort: {
      label: string;
      newest: string;
      oldest: string;
      priceAsc: string;
      priceDesc: string;
      nameAsc: string;
      nameDesc: string;
      rating: string;
    };
    view: { grid: string; list: string };
    perPage: { label: string; perPage: string };
  };
  search: string;
  onSearchChange: (value: string) => void;
  sort: string;
  onSortChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  onOpenFilters: () => void;
}

const PAGE_SIZES = [12, 24, 48];

export function SearchSortBar({
  dict,
  search,
  onSearchChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  pageSize,
  onPageSizeChange,
  onOpenFilters,
}: SearchSortBarProps) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      {/* Search row */}
      <div className="flex gap-3">
        <button
          onClick={onOpenFilters}
          className="flex items-center gap-2 rounded-md px-3 py-2 lg:hidden"
          style={{
            background: "var(--bg-tertiary)",
            border: "1px solid var(--bg-border)",
            color: "var(--white-dim)",
          }}
        >
          <SlidersHorizontal size={16} />
        </button>

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
            className="w-full outline-none"
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

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Sort */}
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", whiteSpace: "nowrap" }}>
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
              fontSize: "var(--text-xs)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-1) var(--space-2)",
            }}
          >
            <option value="-created_at">{dict.sort.newest}</option>
            <option value="created_at">{dict.sort.oldest}</option>
            <option value="min_price">{dict.sort.priceAsc}</option>
            <option value="-min_price">{dict.sort.priceDesc}</option>
            <option value="-average_rating">{dict.sort.rating}</option>
          </select>
        </div>

        {/* Per page */}
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", whiteSpace: "nowrap" }}>
            {dict.perPage.label}
          </span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--bg-border)",
              color: "var(--white)",
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-xs)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-1) var(--space-2)",
            }}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
            {dict.perPage.perPage}
          </span>
        </div>

        <div className="flex-1" />

        {/* View toggle */}
        <div className="flex overflow-hidden rounded-md" style={{ border: "1px solid var(--bg-border)" }}>
          <button
            onClick={() => onViewModeChange("grid")}
            className="flex items-center gap-1 px-3 py-1.5"
            style={{
              background: viewMode === "grid" ? "var(--gold)" : "var(--bg-tertiary)",
              color: viewMode === "grid" ? "var(--black)" : "var(--white-dim)",
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-xs)",
            }}
          >
            <LayoutGrid size={14} />
            <span className="hidden sm:inline">{dict.view.grid}</span>
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className="flex items-center gap-1 px-3 py-1.5"
            style={{
              background: viewMode === "list" ? "var(--gold)" : "var(--bg-tertiary)",
              color: viewMode === "list" ? "var(--black)" : "var(--white-dim)",
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-xs)",
              borderLeft: "1px solid var(--bg-border)",
            }}
          >
            <List size={14} />
            <span className="hidden sm:inline">{dict.view.list}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
