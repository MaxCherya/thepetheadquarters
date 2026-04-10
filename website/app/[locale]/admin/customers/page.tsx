"use client";

import { useMemo } from "react";
import Link from "next/link";
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

interface Customer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_email_verified: boolean;
  is_active: boolean;
  date_joined: string;
  order_count: number;
  total_spent: number;
}

function formatPrice(p: number | null): string {
  return `£${((p || 0) / 100).toFixed(2)}`;
}

export default function AdminCustomersPage() {
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

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "customers", "list", queryString],
    queryFn: async () => {
      const url = `${endpoints.admin.customers.list}${queryString ? `?${queryString}` : ""}`;
      return apiClient.get<PaginatedResponse<Customer>>(url);
    },
  });

  const customers = data?.results || [];

  const filters: FilterDef[] = [
    { key: "search", label: "Search", type: "search", placeholder: "Search by email or name..." },
    { key: "verified", label: "Email verified", type: "boolean" },
    { key: "is_active", label: "Active", type: "boolean" },
    { key: "has_orders", label: "Has placed orders", type: "boolean" },
    { key: "spent", label: "Total spent (pence)", type: "range", placeholder: "pence" },
    { key: "date_from", label: "Joined from", type: "text", placeholder: "YYYY-MM-DD" },
    { key: "date_to", label: "Joined to", type: "text", placeholder: "YYYY-MM-DD" },
  ];

  const sortOptions = [
    { value: "-date_joined", label: "Newest first" },
    { value: "date_joined", label: "Oldest first" },
    { value: "-total_spent", label: "Top spenders" },
    { value: "-order_count", label: "Most orders" },
    { value: "email", label: "Email A-Z" },
  ];

  return (
    <div>
      <h1 className="mb-6" style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)" }}>
        Customers
      </h1>

      <FilterBar
        filters={filters}
        values={values}
        onChange={setValues}
        sortOptions={sortOptions}
        sortValue={values.ordering || "-date_joined"}
        onSortChange={(v) => setValues({ ...values, ordering: v })}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full" style={{ border: "2px solid var(--bg-border)", borderTopColor: "var(--gold)" }} />
        </div>
      ) : customers.length === 0 ? (
        <p className="rounded-lg py-12 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>
          No customers match the current filters.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
          {customers.map((c, i) => (
            <Link key={c.id} href={`/admin/customers/${c.id}`} className="flex items-center justify-between transition-colors duration-200 hover:bg-[rgba(187,148,41,0.05)]" style={{ padding: "var(--space-4) var(--space-5)", borderBottom: i < customers.length - 1 ? "1px solid var(--bg-border)" : "none" }}>
              <div>
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--white)" }}>
                  {c.first_name} {c.last_name}
                  {!c.is_active && <span className="ml-2 rounded px-1.5 py-0.5" style={{ background: "rgba(198,40,40,0.1)", color: "var(--error)", fontSize: "10px", textTransform: "uppercase" }}>Banned</span>}
                  {!c.is_email_verified && <span className="ml-2 rounded px-1.5 py-0.5" style={{ background: "rgba(230,81,0,0.1)", color: "var(--warning)", fontSize: "10px", textTransform: "uppercase" }}>Unverified</span>}
                </p>
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
                  {c.email}
                </p>
              </div>
              <div className="text-right">
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--gold-dark)" }}>
                  {formatPrice(c.total_spent)}
                </p>
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
                  {c.order_count} orders
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
