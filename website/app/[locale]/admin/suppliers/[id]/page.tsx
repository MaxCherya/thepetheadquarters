"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Truck } from "lucide-react";
import { toast } from "@heroui/react";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";

interface Supplier {
  id: string;
  name: string;
  contact_email: string;
  contact_phone: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  postcode: string;
  country: string;
  payment_terms: string;
  is_dropshipper: boolean;
  is_active: boolean;
  notes: string;
}

interface SupplierProduct {
  id: string;
  variant: string;
  variant_sku: string;
  product_name: string;
  supplier_sku: string;
  last_cost: number;
  is_preferred: boolean;
}

interface PORow {
  id: string;
  po_number: string;
  status: string;
  total: number;
  created_at: string;
}

const PAYMENT_TERMS_LABELS: Record<string, string> = {
  cod: "Cash on Delivery", net_7: "Net 7", net_14: "Net 14", net_30: "Net 30", net_60: "Net 60", net_90: "Net 90",
};

function formatPrice(p: number): string { return `£${(p / 100).toFixed(2)}`; }
function formatDate(s: string): string { return new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }

type Tab = "details" | "products" | "purchases";

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [purchases, setPurchases] = useState<PORow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("details");
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Supplier>>({});

  useEffect(() => {
    Promise.all([
      apiClient.get<{ status: string; data: Supplier }>(endpoints.admin.suppliers.detail(id)),
      apiClient.get<{ status: string; data: SupplierProduct[] }>(endpoints.admin.suppliers.products(id)),
      apiClient.get<{ status: string; data: PORow[] }>(endpoints.admin.suppliers.purchases(id)),
    ])
      .then(([s, p, po]) => {
        setSupplier(s.data);
        setProducts(p.data || []);
        setPurchases(po.data || []);
        setFormData(s.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    try {
      const res = await apiClient.patch<{ status: string; data: Supplier }>(
        endpoints.admin.suppliers.detail(id),
        formData,
      );
      setSupplier(res.data);
      setEditing(false);
      toast.success("Saved");
    } catch {
      toast.danger("Save failed");
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full" style={{ border: "2px solid var(--bg-border)", borderTopColor: "var(--gold)" }} /></div>;
  }

  if (!supplier) {
    return <div className="rounded-lg py-16 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}><p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>Supplier not found.</p></div>;
  }

  const labelStyle = { fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)" as const, color: "var(--white-dim)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, display: "block" as const, marginBottom: "var(--space-2)" };
  const inputStyle = { background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", color: "var(--white)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)", width: "100%" };

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/suppliers" className="inline-flex w-fit items-center gap-2 transition-colors duration-200 hover:text-[var(--gold)]" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" }}>
        <ArrowLeft size={14} /> Back
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)" }}>
            {supplier.name}
            {supplier.is_dropshipper && <span className="ml-3 rounded-full px-2 py-0.5" style={{ background: "rgba(21,101,192,0.1)", color: "var(--info)", fontSize: "var(--text-xs)", fontWeight: 600, textTransform: "uppercase", verticalAlign: "middle" }}>Dropshipper</span>}
          </h1>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>
            {PAYMENT_TERMS_LABELS[supplier.payment_terms]} {!supplier.is_active && <span style={{ color: "var(--error)" }}>· Inactive</span>}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--bg-border)" }}>
        {(["details", "products", "purchases"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-2.5" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: tab === t ? "var(--weight-semibold)" : "var(--weight-regular)", color: tab === t ? "var(--gold-dark)" : "var(--white-faint)", borderBottom: tab === t ? "2px solid var(--gold)" : "2px solid transparent", marginBottom: "-1px", textTransform: "capitalize" }}>
            {t}
            {t === "products" && ` (${products.length})`}
            {t === "purchases" && ` (${purchases.length})`}
          </button>
        ))}
      </div>

      {tab === "details" && (
        <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
          {!editing ? (
            <>
              <div className="grid gap-3 text-sm md:grid-cols-2" style={{ fontFamily: "var(--font-montserrat)", color: "var(--white-dim)" }}>
                <div>Email: <span style={{ color: "var(--white)" }}>{supplier.contact_email || "—"}</span></div>
                <div>Phone: <span style={{ color: "var(--white)" }}>{supplier.contact_phone || "—"}</span></div>
                <div className="md:col-span-2">
                  Address: <span style={{ color: "var(--white)" }}>
                    {[supplier.address_line_1, supplier.address_line_2, supplier.city, supplier.postcode, supplier.country].filter(Boolean).join(", ") || "—"}
                  </span>
                </div>
                {supplier.notes && (
                  <div className="md:col-span-2">Notes: <span style={{ color: "var(--white)" }}>{supplier.notes}</span></div>
                )}
              </div>
              <button onClick={() => setEditing(true)} className="mt-4 rounded-md px-4 py-2" style={{ border: "1px solid var(--bg-border)", color: "var(--gold-dark)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)" }}>
                Edit
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div><label style={labelStyle}>Name</label><input value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Email</label><input value={formData.contact_email || ""} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Phone</label><input value={formData.contact_phone || ""} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} style={inputStyle} /></div>
                <div>
                  <label style={labelStyle}>Payment Terms</label>
                  <select value={formData.payment_terms || "net_30"} onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })} style={inputStyle}>
                    {Object.entries(PAYMENT_TERMS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSave} className="rounded-md px-5 py-2.5" style={{ background: "var(--gold)", color: "#FFFFFF", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}>Save</button>
                <button onClick={() => { setEditing(false); setFormData(supplier); }} className="rounded-md px-5 py-2.5" style={{ border: "1px solid var(--bg-border)", color: "var(--white-dim)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)" }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "products" && (
        products.length === 0 ? (
          <p className="rounded-lg py-12 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>
            No products linked yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
            {products.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between" style={{ padding: "var(--space-4) var(--space-5)", borderBottom: i < products.length - 1 ? "1px solid var(--bg-border)" : "none" }}>
                <div>
                  <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white)", fontWeight: "var(--weight-medium)" }}>
                    {p.product_name}
                    {p.is_preferred && <span className="ml-2 text-xs" style={{ color: "var(--gold-dark)" }}>★ Preferred</span>}
                  </p>
                  <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
                    {p.variant_sku}{p.supplier_sku && ` · supplier SKU: ${p.supplier_sku}`}
                  </p>
                </div>
                <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--gold-dark)" }}>
                  {formatPrice(p.last_cost)}
                </span>
              </div>
            ))}
          </div>
        )
      )}

      {tab === "purchases" && (
        purchases.length === 0 ? (
          <p className="rounded-lg py-12 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>
            No purchase orders yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
            {purchases.map((po, i) => (
              <Link key={po.id} href={`/admin/purchase-orders/${po.id}`} className="flex items-center justify-between transition-colors duration-200 hover:bg-[rgba(187,148,41,0.05)]" style={{ padding: "var(--space-4) var(--space-5)", borderBottom: i < purchases.length - 1 ? "1px solid var(--bg-border)" : "none" }}>
                <div>
                  <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white)", fontWeight: "var(--weight-semibold)" }}>{po.po_number}</p>
                  <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>{po.status} · {formatDate(po.created_at)}</p>
                </div>
                <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--gold-dark)" }}>{formatPrice(po.total)}</span>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}
