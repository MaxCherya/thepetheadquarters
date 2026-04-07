"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Skeleton } from "@heroui/react";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "../../../_components/product-card";
import { ProductListItem } from "../../../products/_components/product-list-item";
import { SearchSortBar } from "../../../products/_components/search-sort-bar";
import { Pagination } from "../../../products/_components/pagination";
import type { Brand } from "@/types/brand";

type ViewMode = "grid" | "list";

interface CategoryProductsViewProps {
  categoryId: string;
  dict: {
    search: { placeholder: string };
    sort: { label: string; newest: string; oldest: string; priceAsc: string; priceDesc: string; nameAsc: string; nameDesc: string; rating: string };
    view: { grid: string; list: string };
    perPage: { label: string; perPage: string };
    results: { showing: string; of: string; products: string; noResults: string; noResultsDescription: string };
    pagination: { previous: string; next: string; page: string; of: string };
  };
  brands: Brand[];
  lang: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function CategoryProductsView({ categoryId, dict, lang }: CategoryProductsViewProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("-created_at");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const topRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(search, 400);

  const params: Record<string, string> = {
    category: categoryId,
    ordering: sort,
    page: String(page),
    page_size: String(pageSize),
  };
  if (debouncedSearch) params.search = debouncedSearch;

  const { data, isLoading } = useProducts(params, lang);
  const products = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div ref={topRef}>
      <SearchSortBar
        dict={dict}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        sort={sort}
        onSortChange={(v) => { setSort(v); setPage(1); }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        pageSize={pageSize}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        onOpenFilters={() => {}}
      />

      {!isLoading && totalCount > 0 && (
        <p className="mb-4" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>
          {dict.results.showing} {products.length} {dict.results.of} {totalCount} {dict.results.products}
        </p>
      )}

      {isLoading && (
        <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3" : "flex flex-col gap-4"}>
          {Array.from({ length: 6 }).map((_, i) => (
            viewMode === "grid" ? (
              <div key={i} className="overflow-hidden rounded-lg" style={{ border: "1px solid var(--bg-border)" }}>
                <Skeleton className="aspect-square w-full rounded-none" />
                <div className="p-3 sm:p-4"><Skeleton className="mb-2 h-5 w-3/4 rounded" /><Skeleton className="h-5 w-1/3 rounded" /></div>
              </div>
            ) : (
              <div key={i} className="flex gap-4 overflow-hidden rounded-lg" style={{ border: "1px solid var(--bg-border)" }}>
                <Skeleton className="h-32 w-32 shrink-0 rounded-none sm:h-44 sm:w-44" />
                <div className="flex flex-1 flex-col justify-center py-3 pr-4"><Skeleton className="mb-2 h-6 w-3/4 rounded" /><Skeleton className="h-5 w-1/4 rounded" /></div>
              </div>
            )
          ))}
        </div>
      )}

      {!isLoading && products.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      {!isLoading && products.length > 0 && viewMode === "list" && (
        <div className="flex flex-col gap-4">
          {products.map((p) => <ProductListItem key={p.id} product={p} />)}
        </div>
      )}

      {!isLoading && products.length === 0 && (
        <div className="py-20 text-center">
          <h3 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-2xl)", color: "var(--white)", marginBottom: "var(--space-2)" }}>{dict.results.noResults}</h3>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)" }}>{dict.results.noResultsDescription}</p>
        </div>
      )}

      {!isLoading && totalPages > 1 && (
        <Pagination dict={dict.pagination} currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
      )}
    </div>
  );
}
