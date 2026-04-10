"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Plus, ClipboardList } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import type { PaginatedResponse } from "@/types/api";
import {
  FilterBar,
  useDebouncedValue,
  useUrlFilters,
  type FilterDef,
} from "../_components/filter-bar";

interface PORow {
  id: string;
  po_number: string;
  supplier_name: string;
  status: string;
  expected_date: string | null;
  total: number;
  item_count: number;
  created_at: string;
  received_at: string | null;
}

interface SupplierOption {
  id: string;
  name: string;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft: { bg: "rgba(102,102,102,0.1)", color: "var(--white-faint)" },
  sent: { bg: "rgba(21,101,192,0.1)", color: "var(--info)" },
  partial: { bg: "rgba(230,81,0,0.1)", color: "var(--warning)" },
  received: { bg: "rgba(46,125,50,0.1)", color: "var(--success)" },
  cancelled: { bg: "rgba(198,40,40,0.08)", color: "var(--error)" },
};

function formatPrice(p: number): string { return `£${(p / 100).toFixed(2)}`; }
function formatDate(s: string): string { return new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }

export default function AdminPurchaseOrdersPage() {
  const [values, setValues] = useUrlFilters({});
  const debouncedSearch = useDebouncedValue(values.search || "", 300);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([k, v]) => {
      if (k === "search") return;
      if (v) params.set(k, v);
    });
    if (debouncedSearch) params.set("search", debouncedSearch);
    return params.toString();
  }, [values, debouncedSearch]);

  const { data, isLoading: loading } = useQuery({
    queryKey: ["admin", "purchase-orders", "list", queryString],
    queryFn: async () => {
      const url = `${endpoints.admin.purchaseOrders.list}${queryString ? `?${queryString}` : ""}`;
      return apiClient.get<PaginatedResponse<PORow>>(url);
    },
  });

  const pos = data?.results || [];

  // Load suppliers for the filter dropdown.
  const { data: suppliersData } = useQuery({
    queryKey: ["admin", "suppliers", "list", "all"],
    queryFn: async () => {
      return apiClient.get<PaginatedResponse<SupplierOption>>(endpoints.admin.suppliers.list);
    },
  });
  const suppliers = suppliersData?.results || [];

  const filters: FilterDef[] = useMemo(
    () => [
      { key: "search", label: "Search", type: "search", placeholder: "PO number, supplier, invoice..." },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "draft", label: "Draft" },
          { value: "sent", label: "Sent" },
          { value: "partial", label: "Partial" },
          { value: "received", label: "Received" },
          { value: "cancelled", label: "Cancelled" },
        ],
      },
      {
        key: "supplier",
        label: "Supplier",
        type: "select",
        options: suppliers.map((s) => ({ value: s.id, label: s.name })),
      },
      { key: "date_from", label: "Created from", type: "text", placeholder: "YYYY-MM-DD" },
      { key: "date_to", label: "Created to", type: "text", placeholder: "YYYY-MM-DD" },
      { key: "total", label: "Total (pence)", type: "range", placeholder: "pence" },
    ],
    [suppliers],
  );

  const sortOptions = [
    { value: "-created_at", label: "Newest first" },
    { value: "created_at", label: "Oldest first" },
    { value: "-total", label: "Total: high to low" },
    { value: "total", label: "Total: low to high" },
    { value: "expected_date", label: "Expected date (soonest)" },
    { value: "po_number", label: "PO number" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)" }}>
          Purchase Orders
        </h1>
        <Link href="/admin/purchase-orders/new" className="flex items-center gap-2 rounded-md px-4 py-2.5" style={{ background: "var(--gold)", color: "#FFFFFF", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}>
          <Plus size={14} />
          New PO
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

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full" style={{ border: "2px solid var(--bg-border)", borderTopColor: "var(--gold)" }} /></div>
      ) : pos.length === 0 ? (
        <div className="rounded-lg py-16 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
          <ClipboardList size={32} className="mx-auto mb-3" style={{ color: "var(--white-faint)" }} />
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>No purchase orders match the current filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
          {pos.map((po, i) => {
            const colors = STATUS_COLORS[po.status] || STATUS_COLORS.draft;
            return (
              <Link key={po.id} href={`/admin/purchase-orders/${po.id}`} className="flex items-center justify-between transition-colors duration-200 hover:bg-[rgba(187,148,41,0.05)]" style={{ padding: "var(--space-4) var(--space-5)", borderBottom: i < pos.length - 1 ? "1px solid var(--bg-border)" : "none" }}>
                <div>
                  <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--white)" }}>{po.po_number}</p>
                  <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>{po.supplier_name} · {po.item_count} items</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="rounded-full px-2 py-0.5" style={{ background: colors.bg, color: colors.color, fontFamily: "var(--font-montserrat)", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>
                    {po.status}
                  </span>
                  <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>{formatDate(po.created_at)}</span>
                  <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--gold-dark)" }}>{formatPrice(po.total)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
