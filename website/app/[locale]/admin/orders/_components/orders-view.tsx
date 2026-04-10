"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAdminOrders } from "@/hooks/use-admin-orders";
import { StatusBadge } from "../../_components/status-badge";
import {
  FilterBar,
  useDebouncedValue,
  useUrlFilters,
  type FilterDef,
} from "../../_components/filter-bar";
import type enAdmin from "@/i18n/dictionaries/en/admin.json";

interface OrdersViewProps {
  dict: typeof enAdmin;
}

const STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"] as const;

function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function OrdersView({ dict }: OrdersViewProps) {
  const [values, setValues] = useUrlFilters({});
  const debouncedSearch = useDebouncedValue(values.search || "", 300);

  const queryFilters = useMemo(() => {
    const f: Record<string, string> = {};
    Object.entries(values).forEach(([k, v]) => {
      if (k === "search") return;
      if (v) f[k] = v;
    });
    if (debouncedSearch) f.search = debouncedSearch;
    return f;
  }, [values, debouncedSearch]);

  const { data, isLoading: loading } = useAdminOrders(queryFilters);
  const orders = data?.results || [];

  const filters: FilterDef[] = useMemo(
    () => [
      { key: "search", label: "Search", type: "search", placeholder: dict.orders.search },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: STATUSES.map((s) => ({ value: s, label: dict.orders.statuses[s] })),
      },
      { key: "date_from", label: "From date", type: "text", placeholder: "YYYY-MM-DD" },
      { key: "date_to", label: "To date", type: "text", placeholder: "YYYY-MM-DD" },
      { key: "total", label: "Total (pence)", type: "range", placeholder: "pence" },
    ],
    [dict],
  );

  const sortOptions = [
    { value: "-created_at", label: "Newest first" },
    { value: "created_at", label: "Oldest first" },
    { value: "-total", label: "Total: high to low" },
    { value: "total", label: "Total: low to high" },
  ];

  return (
    <div>
      <FilterBar
        filters={filters}
        values={values}
        onChange={setValues}
        sortOptions={sortOptions}
        sortValue={values.ordering || "-created_at"}
        onSortChange={(v) => setValues({ ...values, ordering: v })}
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full" style={{ border: "2px solid var(--bg-border)", borderTopColor: "var(--gold)" }} />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-lg py-16 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>
            {dict.orders.noOrders}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
          {orders.map((order, i) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.order_number}`}
              className="flex items-center justify-between transition-colors duration-200 hover:bg-[rgba(187,148,41,0.05)]"
              style={{
                padding: "var(--space-4) var(--space-5)",
                borderBottom: i < orders.length - 1 ? "1px solid var(--bg-border)" : "none",
              }}
            >
              <div className="flex flex-1 items-center gap-4">
                <div>
                  <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--white)" }}>
                    {order.order_number}
                  </p>
                  <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
                    {order.customer_name} · {order.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={order.status} size="sm" />
                <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
                  {formatDate(order.created_at)}
                </span>
                <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--gold-dark)", minWidth: "70px", textAlign: "right" }}>
                  {formatPrice(order.total)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
