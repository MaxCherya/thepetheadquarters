"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Smartphone, Monitor, Tablet, Bot, User as UserIcon } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import type { PaginatedResponse } from "@/types/api";
import type { AnalyticsVisitorListItem } from "@/types/admin";
import {
  FilterBar,
  useDebouncedValue,
  useUrlFilters,
  type FilterDef,
} from "../../_components/filter-bar";

function formatDateTime(s: string): string {
  return new Date(s).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function deviceIcon(type: string) {
  switch (type) {
    case "mobile":
      return Smartphone;
    case "tablet":
      return Tablet;
    case "desktop":
      return Monitor;
    case "bot":
      return Bot;
    default:
      return Monitor;
  }
}

export default function AdminVisitorsPage() {
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
    queryKey: ["admin", "analytics", "visitors", queryString],
    queryFn: async () => {
      const url = `${endpoints.admin.analytics.visitors}${queryString ? `?${queryString}` : ""}`;
      return apiClient.get<PaginatedResponse<AnalyticsVisitorListItem>>(url);
    },
  });

  const visitors = data?.results || [];

  const filters: FilterDef[] = [
    { key: "search", label: "Search", type: "search", placeholder: "Customer email, name, or country code..." },
    { key: "has_user", label: "Logged-in customer", type: "boolean" },
    {
      key: "device_type",
      label: "Device",
      type: "select",
      options: [
        { value: "desktop", label: "Desktop" },
        { value: "mobile", label: "Mobile" },
        { value: "tablet", label: "Tablet" },
      ],
    },
    { key: "country", label: "Country (ISO 2)", type: "text", placeholder: "GB" },
    { key: "date_from", label: "From date", type: "text", placeholder: "YYYY-MM-DD" },
    { key: "date_to", label: "To date", type: "text", placeholder: "YYYY-MM-DD" },
  ];

  const sortOptions = [
    { value: "-last_seen_at", label: "Last seen (newest)" },
    { value: "-first_seen_at", label: "First seen (newest)" },
    { value: "-pageview_count", label: "Most pageviews" },
    { value: "-session_count", label: "Most sessions" },
  ];

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/analytics"
          className="mb-2 inline-block"
          style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}
        >
          ← Back to overview
        </Link>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)" }}>
          Visitors
        </h1>
        <p className="mt-1" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
          Each row represents one daily visitor identity. Click into any row to see their full session history,
          page paths, and events. Logged-in customers are linked to their account.
        </p>
      </div>

      <FilterBar
        filters={filters}
        values={values}
        onChange={setValues}
        sortOptions={sortOptions}
        sortValue={values.ordering || "-last_seen_at"}
        onSortChange={(v) => setValues({ ...values, ordering: v })}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full" style={{ border: "2px solid var(--bg-border)", borderTopColor: "var(--gold)" }} />
        </div>
      ) : visitors.length === 0 ? (
        <p className="rounded-lg py-12 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>
          No visitors match the current filters.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
          {visitors.map((v, i) => {
            const DeviceIcon = deviceIcon(v.device_type);
            return (
              <Link
                key={v.id}
                href={`/admin/analytics/visitors/${v.id}`}
                className="flex flex-col gap-2 transition-colors duration-200 hover:bg-[rgba(187,148,41,0.05)] sm:flex-row sm:items-center sm:gap-4"
                style={{
                  padding: "var(--space-4) var(--space-5)",
                  borderBottom: i < visitors.length - 1 ? "1px solid var(--bg-border)" : "none",
                }}
              >
                <div className="flex shrink-0 items-center gap-2">
                  <DeviceIcon size={14} style={{ color: "var(--white-faint)" }} />
                  {v.user_email && <UserIcon size={12} style={{ color: "var(--gold-dark)" }} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--white)" }}>
                    {v.user_email || `Anonymous · ${v.country || "??"}`}
                    {v.country && v.user_email && (
                      <span style={{ color: "var(--white-faint)", fontWeight: "var(--weight-regular)" }}>
                        {" "}
                        · {v.country}
                      </span>
                    )}
                  </p>
                  <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
                    {v.browser || "Unknown"} on {v.os || "Unknown"} · {v.session_count} sessions · {v.pageview_count} pageviews
                  </p>
                </div>
                <span className="shrink-0" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
                  {formatDateTime(v.last_seen_at)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
