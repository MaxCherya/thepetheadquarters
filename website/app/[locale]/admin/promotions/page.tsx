"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Plus, Tag, Truck } from "lucide-react";
import {
  FilterBar,
  useDebouncedValue,
  useUrlFilters,
  type FilterDef,
} from "../_components/filter-bar";
import { useAdminPromotions } from "@/hooks/use-admin-promotions";
import type { PromotionDiscountType, PromotionSource } from "@/types/admin";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const DISCOUNT_LABEL: Record<PromotionDiscountType, string> = {
  percent: "% off",
  free_shipping: "Free shipping",
};

const SOURCE_LABEL: Record<PromotionSource, string> = {
  newsletter: "Newsletter",
  influencer: "Influencer",
  manual: "Manual",
  campaign: "Campaign",
  referral: "Referral",
};

export default function AdminPromotionsPage() {
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

  const { data, isLoading } = useAdminPromotions(queryString);
  const promotions = data?.results || [];

  const filters: FilterDef[] = [
    { key: "search", label: "Search", type: "search", placeholder: "Code, name, or campaign label..." },
    { key: "is_active", label: "Active", type: "boolean" },
    {
      key: "source",
      label: "Source",
      type: "select",
      options: Object.entries(SOURCE_LABEL).map(([value, label]) => ({ value, label })),
    },
    {
      key: "discount_type",
      label: "Discount type",
      type: "select",
      options: [
        { value: "percent", label: "Percentage" },
        { value: "free_shipping", label: "Free shipping" },
      ],
    },
    {
      key: "scope",
      label: "Scope",
      type: "select",
      options: [
        { value: "all", label: "Whole cart" },
        { value: "category", label: "Categories" },
        { value: "brand", label: "Brands" },
        { value: "product", label: "Products" },
      ],
    },
    { key: "date_from", label: "Created from", type: "text", placeholder: "YYYY-MM-DD" },
    { key: "date_to", label: "Created to", type: "text", placeholder: "YYYY-MM-DD" },
  ];

  const sortOptions = [
    { value: "-created_at", label: "Newest first" },
    { value: "created_at", label: "Oldest first" },
    { value: "-times_used", label: "Most used" },
    { value: "times_used", label: "Least used" },
    { value: "-ends_at", label: "Ending soonest" },
    { value: "code", label: "Code A-Z" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)" }}>
          Promotions
        </h1>
        <Link
          href="/admin/promotions/new"
          className="flex items-center gap-2 rounded-md px-4 py-2.5"
          style={{ background: "var(--gold)", color: "#FFFFFF", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}
        >
          <Plus size={14} />
          New Promotion
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
      ) : promotions.length === 0 ? (
        <div className="rounded-lg py-16 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
          <Tag size={32} className="mx-auto mb-3" style={{ color: "var(--white-faint)" }} />
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>
            No promotions yet. Create your first code to start tracking attribution.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
          {promotions.map((p, i) => {
            const usagePct =
              p.max_uses_total && p.max_uses_total > 0
                ? Math.min(100, (p.times_used / p.max_uses_total) * 100)
                : null;
            return (
              <Link
                key={p.id}
                href={`/admin/promotions/${p.id}`}
                className="block transition-colors duration-200 hover:bg-[rgba(187,148,41,0.05)]"
                style={{
                  padding: "var(--space-4) var(--space-5)",
                  borderBottom: i < promotions.length - 1 ? "1px solid var(--bg-border)" : "none",
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {p.discount_type === "free_shipping" ? (
                        <Truck size={14} style={{ color: "var(--gold-dark)" }} />
                      ) : (
                        <Tag size={14} style={{ color: "var(--gold-dark)" }} />
                      )}
                      <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--white)", letterSpacing: "var(--tracking-wide)" }}>
                        {p.code}
                      </p>
                      {!p.is_active && (
                        <span className="rounded px-1.5 py-0.5" style={{ background: "rgba(198,40,40,0.1)", color: "var(--error)", fontSize: "10px", textTransform: "uppercase" }}>
                          Inactive
                        </span>
                      )}
                      <span className="rounded px-1.5 py-0.5" style={{ background: "rgba(187,148,41,0.08)", color: "var(--gold-dark)", fontSize: "10px", textTransform: "uppercase" }}>
                        {SOURCE_LABEL[p.source]}
                      </span>
                    </div>
                    <p className="truncate" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", marginTop: "var(--space-1)" }}>
                      {p.name}
                    </p>
                  </div>

                  <div className="text-right">
                    <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--gold-dark)" }}>
                      {p.discount_type === "percent" ? `${p.discount_value}% off` : DISCOUNT_LABEL[p.discount_type]}
                    </p>
                    <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
                      {p.click_count} clicks · {p.times_used}
                      {p.max_uses_total ? ` / ${p.max_uses_total}` : ""} uses
                      {p.ends_at ? ` · ends ${formatDate(p.ends_at)}` : ""}
                    </p>
                  </div>
                </div>

                {usagePct !== null && (
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full" style={{ background: "var(--bg-tertiary)" }}>
                    <div className="h-full" style={{ width: `${usagePct}%`, background: "var(--gold)" }} />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
