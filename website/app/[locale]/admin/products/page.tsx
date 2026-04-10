"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import type { PaginatedResponse } from "@/types/api";
import {
  FilterBar,
  useDebouncedValue,
  useUrlFilters,
  type FilterDef,
} from "../_components/filter-bar";
import { useAdminBrands, useAdminCategories } from "@/hooks/use-admin-catalog";

interface AdminProductRow {
  id: string;
  slug: string;
  name: string;
  primary_image: string;
  fulfillment_type: string;
  is_featured: boolean;
  is_active: boolean;
  variant_count: number;
  total_stock: number;
  min_price: number | null;
}

function formatPrice(pence: number | null): string {
  if (pence === null) return "—";
  return `£${(pence / 100).toFixed(2)}`;
}

export default function AdminProductsPage() {
  const [values, setValues] = useUrlFilters({});
  const debouncedSearch = useDebouncedValue(values.search || "", 300);

  const { data: brands } = useAdminBrands();
  const { data: categories } = useAdminCategories();

  // Build query string from filter values, debouncing only the search input.
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([k, v]) => {
      if (k === "search") return;
      if (v) params.set(k, v);
    });
    if (debouncedSearch) params.set("search", debouncedSearch);
    return params.toString();
  }, [values, debouncedSearch]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products", "list", queryString],
    queryFn: async () => {
      const url = `${endpoints.admin.products.list}${queryString ? `?${queryString}` : ""}`;
      return apiClient.get<PaginatedResponse<AdminProductRow>>(url);
    },
  });

  const products = data?.results || [];

  const filters: FilterDef[] = useMemo(
    () => [
      { key: "search", label: "Search", type: "search", placeholder: "Search by name, slug, or SKU..." },
      {
        key: "category",
        label: "Category",
        type: "select",
        options: (categories || []).map((c) => ({ value: c.id, label: c.name })),
      },
      {
        key: "brand",
        label: "Brand",
        type: "select",
        options: (brands || []).map((b) => ({ value: b.id, label: b.name })),
      },
      {
        key: "fulfillment_type",
        label: "Fulfillment",
        type: "select",
        options: [
          { value: "self", label: "Self-fulfilled" },
          { value: "dropship", label: "Dropship" },
        ],
      },
      {
        key: "stock",
        label: "Stock level",
        type: "select",
        options: [
          { value: "in", label: "In stock (10+)" },
          { value: "low", label: "Low stock (1-9)" },
          { value: "out", label: "Out of stock" },
        ],
      },
      { key: "is_active", label: "Active", type: "boolean" },
      { key: "is_featured", label: "Featured", type: "boolean" },
      { key: "price", label: "Price (pence)", type: "range", placeholder: "pence" },
    ],
    [brands, categories],
  );

  const sortOptions = [
    { value: "-created_at", label: "Newest first" },
    { value: "created_at", label: "Oldest first" },
    { value: "min_price", label: "Price: low to high" },
    { value: "-min_price", label: "Price: high to low" },
    { value: "-total_stock", label: "Stock: high to low" },
    { value: "total_stock", label: "Stock: low to high" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)" }}>
          Products
        </h1>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 rounded-md px-4 py-2.5"
          style={{ background: "var(--gold)", color: "#FFFFFF", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}
        >
          <Plus size={14} />
          New Product
        </Link>
      </div>

      <FilterBar
        filters={filters}
        values={values}
        onChange={setValues}
        sortOptions={sortOptions}
        sortValue={values.ordering || "-created_at"}
        onSortChange={(v) => setValues({ ...values, ordering: v })}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full" style={{ border: "2px solid var(--bg-border)", borderTopColor: "var(--gold)" }} />
        </div>
      ) : products.length === 0 ? (
        <p className="rounded-lg py-12 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>
          No products match the current filters.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
          {products.map((p, i) => (
            <Link key={p.id} href={`/admin/products/${p.id}`} className="flex items-center gap-4 transition-colors duration-200 hover:bg-[rgba(187,148,41,0.05)]" style={{ padding: "var(--space-4) var(--space-5)", borderBottom: i < products.length - 1 ? "1px solid var(--bg-border)" : "none" }}>
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md" style={{ background: "var(--bg-tertiary)" }}>
                {p.primary_image && <Image src={p.primary_image} alt={p.name} fill sizes="48px" className="object-cover" />}
              </div>
              <div className="flex-1">
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--white)" }}>
                  {p.name}
                  {!p.is_active && <span className="ml-2 rounded px-1.5 py-0.5" style={{ background: "rgba(198,40,40,0.1)", color: "var(--error)", fontSize: "10px", textTransform: "uppercase" }}>Inactive</span>}
                  {p.fulfillment_type === "dropship" && <span className="ml-2 rounded px-1.5 py-0.5" style={{ background: "rgba(21,101,192,0.1)", color: "var(--info)", fontSize: "10px", textTransform: "uppercase" }}>Dropship</span>}
                </p>
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
                  {p.variant_count} variants · {p.total_stock} in stock
                </p>
              </div>
              <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--gold-dark)" }}>
                {formatPrice(p.min_price)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
