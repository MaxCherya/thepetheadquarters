"use client";

import { useMemo } from "react";
import Image from "next/image";
import { toast } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

interface InventoryItem {
  id: string;
  sku: string;
  product_id: string;
  product_name: string;
  primary_image: string;
  price: number;
  stock_quantity: number;
}

function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

const inventoryListKey = (qs: string) => ["admin", "inventory", "list", qs] as const;

export default function AdminInventoryPage() {
  const qc = useQueryClient();
  const [values, setValues] = useUrlFilters({});
  const debouncedSearch = useDebouncedValue(values.search || "", 300);

  const { data: brands } = useAdminBrands();
  const { data: categories } = useAdminCategories();

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
    queryKey: inventoryListKey(queryString),
    queryFn: async () => {
      const url = `${endpoints.admin.inventory.list}${queryString ? `?${queryString}` : ""}`;
      return apiClient.get<PaginatedResponse<InventoryItem>>(url);
    },
  });

  const items = data?.results || [];

  const updateStock = useMutation({
    mutationFn: async ({ variantId, qty }: { variantId: string; qty: number }) => {
      return apiClient.patch(endpoints.admin.inventory.update(variantId), { stock_quantity: qty });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "inventory"] });
      toast.success("Stock updated");
    },
    onError: () => toast.danger("Update failed"),
  });

  const filters: FilterDef[] = useMemo(
    () => [
      { key: "search", label: "Search", type: "search", placeholder: "Search by SKU or product name..." },
      {
        key: "level",
        label: "Stock level",
        type: "select",
        options: [
          { value: "in", label: "In stock (10+)" },
          { value: "low", label: "Low (1-9)" },
          { value: "out", label: "Out of stock" },
        ],
      },
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
      { key: "stock", label: "Stock range", type: "range", placeholder: "qty" },
    ],
    [brands, categories],
  );

  const sortOptions = [
    { value: "stock_quantity", label: "Stock: low to high" },
    { value: "-stock_quantity", label: "Stock: high to low" },
    { value: "sku", label: "SKU A-Z" },
    { value: "-sku", label: "SKU Z-A" },
    { value: "price", label: "Price: low to high" },
    { value: "-price", label: "Price: high to low" },
  ];

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-4">
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)" }}>
          Inventory
        </h1>
      </div>
      <p className="mb-6" style={{ fontFamily: "var(--font-montserrat)", fontSize: "12px", color: "var(--white-faint)", lineHeight: "var(--leading-relaxed)" }}>
        Type the number of units you have on hand and click away to save. Red means out of stock, orange means low.
        Stock changes are logged in the audit trail.
      </p>

      <FilterBar
        filters={filters}
        values={values}
        onChange={setValues}
        sortOptions={sortOptions}
        sortValue={values.ordering || "stock_quantity"}
        onSortChange={(v) => setValues({ ...values, ordering: v })}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full" style={{ border: "2px solid var(--bg-border)", borderTopColor: "var(--gold)" }} />
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-lg py-12 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>
          No variants match the current filters.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
          {items.map((it, i) => (
            <div key={it.id} className="flex items-center gap-4" style={{ padding: "var(--space-4) var(--space-5)", borderBottom: i < items.length - 1 ? "1px solid var(--bg-border)" : "none" }}>
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md" style={{ background: "var(--bg-tertiary)" }}>
                {it.primary_image && <Image src={it.primary_image} alt={it.product_name} fill sizes="48px" className="object-cover" />}
              </div>
              <div className="flex-1">
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--white)" }}>
                  {it.product_name}
                </p>
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
                  {it.sku} · {formatPrice(it.price)}
                </p>
              </div>
              <input
                key={`${it.id}-${it.stock_quantity}`}
                type="number"
                min={0}
                defaultValue={it.stock_quantity}
                onBlur={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v !== it.stock_quantity) {
                    updateStock.mutate({ variantId: it.id, qty: v });
                  }
                }}
                style={{
                  width: "80px",
                  background: it.stock_quantity === 0 ? "rgba(198,40,40,0.08)" : it.stock_quantity < 10 ? "rgba(230,81,0,0.08)" : "var(--bg-tertiary)",
                  border: "1px solid var(--bg-border)",
                  color: "var(--white)",
                  fontFamily: "var(--font-montserrat)",
                  fontSize: "var(--text-sm)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-2)",
                  textAlign: "center",
                  outline: "none",
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
