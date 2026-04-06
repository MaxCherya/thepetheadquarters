"use client";

import { X } from "lucide-react";
import type { Category } from "@/types/category";
import type { Brand } from "@/types/brand";

interface Filters {
  category: string;
  brand: string;
  min_price: string;
  max_price: string;
  in_stock: string;
  on_sale: string;
  featured: string;
}

interface FilterSidebarProps {
  dict: {
    title: string;
    category: string;
    brand: string;
    price: string;
    inStock: string;
    onSale: string;
    featured: string;
    clear: string;
    apply: string;
    allCategories: string;
    allBrands: string;
  };
  categories: Category[];
  brands: Brand[];
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string) => void;
  onClear: () => void;
  open: boolean;
  onClose: () => void;
}

export function FilterSidebar({
  dict,
  categories,
  brands,
  filters,
  onFilterChange,
  onClear,
  open,
  onClose,
}: FilterSidebarProps) {
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  const content = (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "var(--text-2xl)",
            fontWeight: "var(--weight-medium)",
            color: "var(--white)",
          }}
        >
          {dict.title}
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            style={{
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-xs)",
              color: "var(--gold)",
              letterSpacing: "var(--tracking-wider)",
              textTransform: "uppercase",
            }}
          >
            {dict.clear}
          </button>
        )}
      </div>

      {/* Category */}
      {categories.length > 0 && (
        <div>
          <label
            style={{
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-medium)",
              color: "var(--white-dim)",
              display: "block",
              marginBottom: "var(--space-2)",
            }}
          >
            {dict.category}
          </label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange("category", e.target.value)}
            style={{
              width: "100%",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--bg-border)",
              color: "var(--white)",
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-sm)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-2) var(--space-3)",
            }}
          >
            <option value="">{dict.allCategories}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Brand */}
      {brands.length > 0 && (
        <div>
          <label
            style={{
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-medium)",
              color: "var(--white-dim)",
              display: "block",
              marginBottom: "var(--space-2)",
            }}
          >
            {dict.brand}
          </label>
          <select
            value={filters.brand}
            onChange={(e) => onFilterChange("brand", e.target.value)}
            style={{
              width: "100%",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--bg-border)",
              color: "var(--white)",
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-sm)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-2) var(--space-3)",
            }}
          >
            <option value="">{dict.allBrands}</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Price Range */}
      <div>
        <label
          style={{
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--weight-medium)",
            color: "var(--white-dim)",
            display: "block",
            marginBottom: "var(--space-3)",
          }}
        >
          {dict.price}
        </label>

        <div
          className="mb-3 text-center"
          style={{
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-lg)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--gold)",
          }}
        >
          {filters.max_price ? `Up to £${filters.max_price}` : "Any price"}
        </div>

        <div className="relative">
          {/* Track background */}
          <div
            className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full"
            style={{ background: "var(--bg-border)" }}
          />
          {/* Active track */}
          <div
            className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full"
            style={{
              width: `${((filters.max_price ? Number(filters.max_price) : 100) / 100) * 100}%`,
              background: "var(--gold)",
            }}
          />
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={filters.max_price ? Number(filters.max_price) : 100}
            onChange={(e) => {
              const v = Number(e.target.value);
              onFilterChange("max_price", v < 100 ? String(v) : "");
            }}
            className="price-range-thumb relative z-10 h-8 w-full appearance-none bg-transparent"
          />
        </div>

        <div
          className="mt-1 flex justify-between"
          style={{
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-xs)",
            color: "var(--white-faint)",
          }}
        >
          <span>£0</span>
          <span>£100+</span>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-3" style={{ cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={filters.in_stock === "true"}
            onChange={(e) => onFilterChange("in_stock", e.target.checked ? "true" : "")}
            className="h-4 w-4 accent-[var(--gold)]"
          />
          <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)" }}>
            {dict.inStock}
          </span>
        </label>

        <label className="flex items-center gap-3" style={{ cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={filters.on_sale === "true"}
            onChange={(e) => onFilterChange("on_sale", e.target.checked ? "true" : "")}
            className="h-4 w-4 accent-[var(--gold)]"
          />
          <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)" }}>
            {dict.onSale}
          </span>
        </label>

        <label className="flex items-center gap-3" style={{ cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={filters.featured === "true"}
            onChange={(e) => onFilterChange("featured", e.target.checked ? "true" : "")}
            className="h-4 w-4 accent-[var(--gold)]"
          />
          <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)" }}>
            {dict.featured}
          </span>
        </label>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">{content}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={onClose}
          />
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl p-6"
            style={{ background: "var(--bg-secondary)" }}
          >
            <div className="mb-4 flex justify-end">
              <button onClick={onClose}>
                <X size={24} style={{ color: "var(--white-dim)" }} />
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
