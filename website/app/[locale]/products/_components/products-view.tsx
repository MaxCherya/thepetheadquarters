"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Skeleton } from "@heroui/react";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "../../_components/product-card";
import { ProductListItem } from "./product-list-item";
import { FilterSidebar } from "./filter-sidebar";
import { SearchSortBar } from "./search-sort-bar";
import { Pagination } from "./pagination";
import type { Category } from "@/types/category";
import type { Brand } from "@/types/brand";

type ViewMode = "grid" | "list";

interface Filters {
  category: string;
  brand: string;
  min_price: string;
  max_price: string;
  in_stock: string;
  on_sale: string;
  featured: string;
}

const emptyFilters: Filters = {
  category: "",
  brand: "",
  min_price: "",
  max_price: "",
  in_stock: "",
  on_sale: "",
  featured: "",
};

interface ProductsViewProps {
  dict: {
    search: { placeholder: string };
    filters: {
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
    sort: { label: string; newest: string; oldest: string; priceAsc: string; priceDesc: string; nameAsc: string; nameDesc: string; rating: string };
    view: { grid: string; list: string };
    perPage: { label: string; perPage: string };
    results: {
      showing: string;
      of: string;
      products: string;
      noResults: string;
      noResultsDescription: string;
    };
    pagination: { previous: string; next: string; page: string; of: string };
  };
  categories: Category[];
  brands: Brand[];
  lang: string;
  initialSearch?: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function ProductsView({ dict, categories, brands, lang, initialSearch = "" }: ProductsViewProps) {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState("-created_at");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(search, 400);
  const debouncedMaxPrice = useDebounce(filters.max_price, 600);

  const params: Record<string, string> = {
    ordering: sort,
    page: String(page),
    page_size: String(pageSize),
  };
  if (debouncedSearch) params.search = debouncedSearch;
  if (filters.category) params.category = filters.category;
  if (filters.brand) params.brand = filters.brand;
  if (debouncedMaxPrice) params.max_price = String(Number(debouncedMaxPrice) * 100);
  if (filters.in_stock) params.in_stock = filters.in_stock;
  if (filters.featured) params.featured = filters.featured;

  const { data, isLoading } = useProducts(params, lang);

  const products = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleFilterChange = useCallback((key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const handleClear = useCallback(() => {
    setFilters(emptyFilters);
    setSearch("");
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSort(value);
    setPage(1);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div ref={topRef} className="flex gap-8">
      <FilterSidebar
        dict={dict.filters}
        categories={categories}
        brands={brands}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={handleClear}
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
      />

      <div className="flex-1">
        <SearchSortBar
          dict={dict}
          search={search}
          onSearchChange={handleSearchChange}
          sort={sort}
          onSortChange={handleSortChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          onOpenFilters={() => setMobileFiltersOpen(true)}
        />

        {/* Results count */}
        {!isLoading && totalCount > 0 && (
          <p
            className="mb-4"
            style={{
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-sm)",
              color: "var(--white-faint)",
            }}
          >
            {dict.results.showing} {products.length} {dict.results.of} {totalCount} {dict.results.products}
          </p>
        )}

        {/* Loading — Grid */}
        {isLoading && viewMode === "grid" && (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-lg" style={{ border: "1px solid var(--bg-border)" }}>
                <Skeleton className="aspect-square w-full rounded-none" />
                <div className="p-3 sm:p-4">
                  <Skeleton className="mb-2 h-5 w-3/4 rounded" />
                  <Skeleton className="h-5 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading — List */}
        {isLoading && viewMode === "list" && (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 overflow-hidden rounded-lg" style={{ border: "1px solid var(--bg-border)" }}>
                <Skeleton className="h-32 w-32 shrink-0 rounded-none sm:h-44 sm:w-44" />
                <div className="flex flex-1 flex-col justify-center py-3 pr-4">
                  <Skeleton className="mb-2 h-6 w-3/4 rounded" />
                  <Skeleton className="mb-2 h-4 w-full rounded" />
                  <Skeleton className="h-5 w-1/4 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Products — Grid */}
        {!isLoading && products.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Products — List */}
        {!isLoading && products.length > 0 && viewMode === "list" && (
          <div className="flex flex-col gap-4">
            {products.map((product) => (
              <ProductListItem key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && products.length === 0 && (
          <div className="py-20 text-center">
            <h3
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "var(--text-2xl)",
                color: "var(--white)",
                marginBottom: "var(--space-2)",
              }}
            >
              {dict.results.noResults}
            </h3>
            <p
              style={{
                fontFamily: "var(--font-montserrat)",
                fontSize: "var(--text-sm)",
                color: "var(--white-dim)",
              }}
            >
              {dict.results.noResultsDescription}
            </p>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <Pagination
            dict={dict.pagination}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}
