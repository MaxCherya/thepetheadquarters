"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Truck } from "lucide-react";
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

interface Supplier {
  id: string;
  name: string;
  contact_email: string;
  contact_phone: string;
  payment_terms: string;
  is_dropshipper: boolean;
  is_active: boolean;
  created_at: string;
}

const PAYMENT_TERMS_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  net_7: "Net 7",
  net_14: "Net 14",
  net_30: "Net 30",
  net_60: "Net 60",
  net_90: "Net 90",
};

export default function AdminSuppliersPage() {
  const qc = useQueryClient();
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
    queryKey: ["admin", "suppliers", "list", queryString],
    queryFn: async () => {
      const url = `${endpoints.admin.suppliers.list}${queryString ? `?${queryString}` : ""}`;
      return apiClient.get<PaginatedResponse<Supplier>>(url);
    },
  });

  const suppliers = data?.results || [];

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact_email: "",
    contact_phone: "",
    payment_terms: "net_30",
    is_dropshipper: false,
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      return apiClient.post<{ status: string; data: Supplier }>(endpoints.admin.suppliers.list, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "suppliers"] });
      setShowForm(false);
      setFormData({ name: "", contact_email: "", contact_phone: "", payment_terms: "net_30", is_dropshipper: false, notes: "" });
      toast.success("Supplier created");
    },
    onError: () => toast.danger("Failed to create supplier"),
  });

  function handleCreate() {
    if (!formData.name.trim()) {
      toast.danger("Name is required");
      return;
    }
    createMutation.mutate(formData);
  }

  const filters: FilterDef[] = [
    { key: "search", label: "Search", type: "search", placeholder: "Search by name, email, or city..." },
    { key: "dropshipper", label: "Dropshipper", type: "boolean" },
    { key: "is_active", label: "Active", type: "boolean" },
    { key: "country", label: "Country", type: "text", placeholder: "e.g. GB" },
    {
      key: "payment_terms",
      label: "Payment terms",
      type: "select",
      options: Object.entries(PAYMENT_TERMS_LABELS).map(([value, label]) => ({ value, label })),
    },
  ];

  const sortOptions = [
    { value: "name", label: "Name A-Z" },
    { value: "-name", label: "Name Z-A" },
    { value: "-created_at", label: "Newest first" },
    { value: "created_at", label: "Oldest first" },
  ];

  const labelStyle = { fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)" as const, fontWeight: "var(--weight-medium)" as const, color: "var(--white-dim)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, display: "block" as const, marginBottom: "var(--space-2)" };
  const inputStyle = { background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", color: "var(--white)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)", width: "100%" };
  const hintStyle = { fontFamily: "var(--font-montserrat)", fontSize: "11px" as const, color: "var(--white-faint)", marginTop: "var(--space-1)", lineHeight: "var(--leading-relaxed)" as const };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)" }}>
          Suppliers
        </h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-md px-4 py-2.5" style={{ background: "var(--gold)", color: "#FFFFFF", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}>
          <Plus size={14} />
          Add Supplier
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
          <h2 className="mb-4" style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-xl)", color: "var(--white)" }}>New Supplier</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label style={labelStyle}>Name *</label>
              <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
              <p style={hintStyle}>Company name as you&apos;d call them, e.g. &quot;Forthglade UK&quot;</p>
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} type="email" style={inputStyle} />
              <p style={hintStyle}>Used to send purchase orders by email later</p>
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} style={inputStyle} />
              <p style={hintStyle}>Optional</p>
            </div>
            <div>
              <label style={labelStyle}>Payment Terms</label>
              <select value={formData.payment_terms} onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })} style={inputStyle}>
                {Object.entries(PAYMENT_TERMS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <p style={hintStyle}>
                When you&apos;re expected to pay. &quot;Net 30&quot; means within 30 days of invoice. &quot;COD&quot; means pay on delivery.
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)" }}>
                <input type="checkbox" checked={formData.is_dropshipper} onChange={(e) => setFormData({ ...formData, is_dropshipper: e.target.checked })} style={{ accentColor: "var(--gold)" }} />
                Dropshipper (ships directly to customers)
              </label>
              <p style={hintStyle}>
                Tick this if the supplier ships products directly to your customers instead of to you. You never hold their stock.
              </p>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={handleCreate} disabled={createMutation.isPending} className="rounded-md px-5 py-2.5 disabled:opacity-50" style={{ background: "var(--gold)", color: "#FFFFFF", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}>
              {createMutation.isPending ? "..." : "Create"}
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-md px-5 py-2.5" style={{ border: "1px solid var(--bg-border)", color: "var(--white-dim)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)" }}>Cancel</button>
          </div>
        </div>
      )}

      <FilterBar
        filters={filters}
        values={values}
        onChange={setValues}
        sortOptions={sortOptions}
        sortValue={values.ordering || "name"}
        onSortChange={(v) => setValues({ ...values, ordering: v })}
      />

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full" style={{ border: "2px solid var(--bg-border)", borderTopColor: "var(--gold)" }} /></div>
      ) : suppliers.length === 0 ? (
        <div className="rounded-lg py-16 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
          <Truck size={32} className="mx-auto mb-3" style={{ color: "var(--white-faint)" }} />
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>No suppliers match the current filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
          {suppliers.map((s, i) => (
            <Link key={s.id} href={`/admin/suppliers/${s.id}`} className="flex items-center justify-between transition-colors duration-200 hover:bg-[rgba(187,148,41,0.05)]" style={{ padding: "var(--space-4) var(--space-5)", borderBottom: i < suppliers.length - 1 ? "1px solid var(--bg-border)" : "none" }}>
              <div>
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--white)" }}>
                  {s.name}
                  {s.is_dropshipper && <span className="ml-2 rounded px-1.5 py-0.5" style={{ background: "rgba(21,101,192,0.1)", color: "var(--info)", fontSize: "10px", textTransform: "uppercase" }}>Dropshipper</span>}
                  {!s.is_active && <span className="ml-2 rounded px-1.5 py-0.5" style={{ background: "rgba(198,40,40,0.1)", color: "var(--error)", fontSize: "10px", textTransform: "uppercase" }}>Inactive</span>}
                </p>
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>{s.contact_email || s.contact_phone || "—"}</p>
              </div>
              <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>{PAYMENT_TERMS_LABELS[s.payment_terms]}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
