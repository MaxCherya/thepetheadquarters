"use client";

import { useEffect, useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";

export interface FilterDef {
  key: string;
  label: string;
  type: "text" | "select" | "boolean" | "number" | "range" | "search";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface FilterValues {
  [key: string]: string;
}

interface FilterBarProps {
  filters: FilterDef[];
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  /** Optional sort options */
  sortOptions?: { value: string; label: string }[];
  sortValue?: string;
  onSortChange?: (value: string) => void;
}

/**
 * Reusable filter bar with collapsible advanced filters and active filter chips.
 * Filter values are controlled — caller is responsible for syncing to URL.
 */
export function FilterBar({
  filters,
  values,
  onChange,
  sortOptions,
  sortValue,
  onSortChange,
}: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);

  const searchFilter = filters.find((f) => f.type === "search");
  const otherFilters = filters.filter((f) => f.type !== "search");

  function update(key: string, value: string) {
    const next = { ...values };
    if (value === "" || value === undefined) {
      delete next[key];
    } else {
      next[key] = value;
    }
    onChange(next);
  }

  function clearAll() {
    const next: FilterValues = {};
    if (searchFilter && values[searchFilter.key]) {
      next[searchFilter.key] = values[searchFilter.key];
    }
    onChange(next);
  }

  // Count active non-search filters
  const activeCount = Object.keys(values).filter(
    (k) => k !== searchFilter?.key && values[k],
  ).length;

  const inputBase = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--bg-border)",
    color: "var(--white)",
    fontFamily: "var(--font-montserrat)",
    fontSize: "var(--text-sm)",
    borderRadius: "var(--radius-md)",
    padding: "var(--space-2) var(--space-3)",
    outline: "none",
  };

  return (
    <div className="mb-6 flex flex-col gap-3">
      {/* Search row */}
      <div className="flex flex-wrap items-center gap-2">
        {searchFilter && (
          <input
            type="text"
            value={values[searchFilter.key] || ""}
            onChange={(e) => update(searchFilter.key, e.target.value)}
            placeholder={searchFilter.placeholder || "Search..."}
            style={{ ...inputBase, flex: "1 1 240px", minWidth: "200px" }}
          />
        )}

        {sortOptions && onSortChange && (
          <select
            value={sortValue || ""}
            onChange={(e) => onSortChange(e.target.value)}
            style={inputBase}
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}

        {otherFilters.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 rounded-md px-3 py-2 transition-colors duration-200"
            style={{
              background: expanded || activeCount > 0 ? "rgba(187,148,41,0.12)" : "var(--bg-secondary)",
              border: `1px solid ${activeCount > 0 ? "var(--gold)" : "var(--bg-border)"}`,
              color: activeCount > 0 ? "var(--gold-dark)" : "var(--white-dim)",
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-sm)",
              fontWeight: activeCount > 0 ? "var(--weight-semibold)" : "var(--weight-regular)",
            }}
          >
            <Filter size={14} />
            Filters
            {activeCount > 0 && (
              <span
                className="rounded-full px-1.5"
                style={{
                  background: "var(--gold)",
                  color: "#FFFFFF",
                  fontSize: "10px",
                  fontWeight: 700,
                  minWidth: "18px",
                  textAlign: "center",
                }}
              >
                {activeCount}
              </span>
            )}
            <ChevronDown size={12} style={{ transform: expanded ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }} />
          </button>
        )}

        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 transition-colors duration-200 hover:text-[var(--error)]"
            style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}
          >
            <X size={12} /> Clear filters
          </button>
        )}
      </div>

      {/* Advanced filters panel */}
      {expanded && otherFilters.length > 0 && (
        <div
          className="grid gap-4 rounded-lg p-5 sm:grid-cols-2 lg:grid-cols-3"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}
        >
          {otherFilters.map((filter) => (
            <div key={filter.key}>
              <label
                style={{
                  fontFamily: "var(--font-montserrat)",
                  fontSize: "10px",
                  color: "var(--white-faint)",
                  letterSpacing: "var(--tracking-wide)",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "var(--space-2)",
                }}
              >
                {filter.label}
              </label>

              {filter.type === "select" && (
                <select
                  value={values[filter.key] || ""}
                  onChange={(e) => update(filter.key, e.target.value)}
                  style={{ ...inputBase, width: "100%", background: "var(--bg-tertiary)" }}
                >
                  <option value="">All</option>
                  {filter.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}

              {filter.type === "boolean" && (
                <select
                  value={values[filter.key] ?? ""}
                  onChange={(e) => update(filter.key, e.target.value)}
                  style={{ ...inputBase, width: "100%", background: "var(--bg-tertiary)" }}
                >
                  <option value="">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              )}

              {filter.type === "text" && (
                <input
                  type="text"
                  value={values[filter.key] || ""}
                  onChange={(e) => update(filter.key, e.target.value)}
                  placeholder={filter.placeholder}
                  style={{ ...inputBase, width: "100%", background: "var(--bg-tertiary)" }}
                />
              )}

              {filter.type === "number" && (
                <input
                  type="number"
                  value={values[filter.key] || ""}
                  onChange={(e) => update(filter.key, e.target.value)}
                  placeholder={filter.placeholder}
                  style={{ ...inputBase, width: "100%", background: "var(--bg-tertiary)" }}
                />
              )}

              {filter.type === "range" && (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={values[`min_${filter.key}`] || ""}
                    onChange={(e) => update(`min_${filter.key}`, e.target.value)}
                    placeholder="Min"
                    style={{ ...inputBase, flex: 1, background: "var(--bg-tertiary)" }}
                  />
                  <input
                    type="number"
                    value={values[`max_${filter.key}`] || ""}
                    onChange={(e) => update(`max_${filter.key}`, e.target.value)}
                    placeholder="Max"
                    style={{ ...inputBase, flex: 1, background: "var(--bg-tertiary)" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Custom hook that syncs a filter values object to URL search params.
 * Returns [values, setValues, debouncedValues].
 */
export function useUrlFilters(initial: FilterValues): [FilterValues, (v: FilterValues) => void] {
  const [values, setValuesState] = useState<FilterValues>(initial);

  function setValues(v: FilterValues) {
    setValuesState(v);

    // Sync to URL
    if (typeof window !== "undefined") {
      const params = new URLSearchParams();
      Object.entries(v).forEach(([k, val]) => {
        if (val) params.set(k, val);
      });
      const qs = params.toString();
      const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
      window.history.replaceState(null, "", newUrl);
    }
  }

  return [values, setValues];
}

/**
 * Debounce hook for search inputs.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
