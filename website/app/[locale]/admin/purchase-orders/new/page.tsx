"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "@heroui/react";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import type { PaginatedResponse } from "@/types/api";
import { CurrencyInput } from "../../_components/currency-input";

interface SupplierOption {
  id: string;
  name: string;
}

interface VariantOption {
  id: string;
  sku: string;
  product_id: string;
  product_name: string;
  cost_price: number;
}

interface POLineItem {
  variant_id: string;
  product_name: string;
  variant_sku: string;
  quantity_ordered: number;
  unit_cost: number;
  vat_amount: number;
}

function formatPrice(p: number): string { return `£${(p / 100).toFixed(2)}`; }

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<POLineItem[]>([]);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiClient.get<PaginatedResponse<SupplierOption>>(endpoints.admin.suppliers.list)
      .then((r) => setSuppliers(r.results || []))
      .catch(() => {});
    apiClient.get<PaginatedResponse<VariantOption & { product_name: string }>>(endpoints.admin.inventory.list + "?page_size=100")
      .then((r) => {
        setVariants((r.results || []).map((v: any) => ({
          id: v.id,
          sku: v.sku,
          product_id: v.product_id,
          product_name: v.product_name,
          cost_price: 0,
        })));
      })
      .catch(() => {});
  }, []);

  function addItem() {
    if (!selectedVariant) return;
    const variant = variants.find((v) => v.id === selectedVariant);
    if (!variant) return;
    if (items.find((i) => i.variant_id === variant.id)) {
      toast.warning("Already added");
      return;
    }
    setItems([
      ...items,
      {
        variant_id: variant.id,
        product_name: variant.product_name,
        variant_sku: variant.sku,
        quantity_ordered: 1,
        unit_cost: 0,
        vat_amount: 0,
      },
    ]);
    setSelectedVariant("");
  }

  function updateItem(idx: number, field: keyof POLineItem, value: number) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it))
    );
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const subtotal = items.reduce((s, i) => s + i.unit_cost * i.quantity_ordered, 0);
  const vatTotal = items.reduce((s, i) => s + i.vat_amount, 0);
  const total = subtotal + vatTotal + shippingCost;

  async function handleSubmit() {
    if (!supplierId) {
      toast.danger("Select a supplier");
      return;
    }
    if (items.length === 0) {
      toast.danger("Add at least one item");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post<{ status: string; data: { id: string } }>(
        endpoints.admin.purchaseOrders.list,
        {
          supplier_id: supplierId,
          expected_date: expectedDate || null,
          shipping_cost: shippingCost,
          notes,
          items: items.map((i) => ({
            variant_id: i.variant_id,
            quantity_ordered: i.quantity_ordered,
            unit_cost: i.unit_cost,
            vat_amount: i.vat_amount,
          })),
        },
      );
      toast.success("Purchase order created");
      router.push(`/admin/purchase-orders/${res.data.id}`);
    } catch {
      toast.danger("Failed to create PO");
    } finally {
      setSubmitting(false);
    }
  }

  const labelStyle = { fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)" as const, color: "var(--white-dim)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, display: "block" as const, marginBottom: "var(--space-2)" };
  const inputStyle = { background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", color: "var(--white)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)", width: "100%" };
  const hintStyle = { fontFamily: "var(--font-montserrat)", fontSize: "11px" as const, color: "var(--white-faint)", marginTop: "var(--space-1)", lineHeight: "var(--leading-relaxed)" as const };

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/purchase-orders" className="inline-flex w-fit items-center gap-2 transition-colors duration-200 hover:text-[var(--gold)]" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" }}>
        <ArrowLeft size={14} /> Back
      </Link>

      <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)" }}>
        New Purchase Order
      </h1>

      <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label style={labelStyle}>Supplier *</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} style={inputStyle}>
              <option value="">— Select supplier —</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <p style={hintStyle}>Who you&apos;re buying from. Add new suppliers in the Suppliers section.</p>
          </div>
          <div>
            <label style={labelStyle}>Expected delivery</label>
            <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} style={inputStyle} />
            <p style={hintStyle}>When the supplier said it should arrive (optional)</p>
          </div>
          <div>
            <label style={labelStyle}>Shipping cost</label>
            <CurrencyInput value={shippingCost} onChange={(p) => setShippingCost(p ?? 0)} />
            <p style={hintStyle}>What the supplier charges for delivery (e.g. £4.50)</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
        <h2 className="mb-2" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>
          Items ({items.length})
        </h2>
        <p className="mb-4" style={{ fontFamily: "var(--font-montserrat)", fontSize: "11px", color: "var(--white-faint)", lineHeight: "var(--leading-relaxed)" }}>
          Add each product you&apos;re buying from this supplier. Pick the variant from the dropdown, then enter how many you ordered, the unit cost, and the VAT.
        </p>

        <div className="mb-4 flex gap-2">
          <select value={selectedVariant} onChange={(e) => setSelectedVariant(e.target.value)} className="flex-1" style={inputStyle}>
            <option value="">— Select product variant —</option>
            {variants.map((v) => <option key={v.id} value={v.id}>{v.product_name} ({v.sku})</option>)}
          </select>
          <button onClick={addItem} className="flex items-center gap-2 rounded-md px-4 py-2.5" style={{ background: "var(--gold)", color: "#FFFFFF", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}>
            <Plus size={14} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="rounded-md py-8 text-center" style={{ background: "var(--bg-tertiary)", border: "1px dashed var(--bg-border)" }}>
            <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)", marginBottom: "var(--space-1)" }}>
              No items added yet
            </p>
            <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
              Pick a product variant from the dropdown above and click + to add it
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item, i) => (
              <div key={item.variant_id} className="rounded-md" style={{ padding: "var(--space-4)", background: "var(--bg-tertiary)" }}>
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white)", fontWeight: "var(--weight-medium)" }}>
                      {item.product_name}
                    </p>
                    <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
                      {item.variant_sku}
                    </p>
                  </div>
                  <button onClick={() => removeItem(i)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[rgba(198,40,40,0.1)]" style={{ color: "var(--white-faint)" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid gap-3" style={{ gridTemplateColumns: "100px 1fr 1fr" }}>
                  <div>
                    <label style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "var(--white-faint)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)", display: "block", marginBottom: "var(--space-1)" }}>
                      Qty
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity_ordered}
                      onChange={(e) => updateItem(i, "quantity_ordered", parseInt(e.target.value) || 1)}
                      style={{
                        width: "100%",
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--bg-border)",
                        color: "var(--white)",
                        fontFamily: "var(--font-montserrat)",
                        fontSize: "var(--text-sm)",
                        borderRadius: "var(--radius-md)",
                        padding: "var(--space-3) var(--space-3)",
                        textAlign: "center",
                        outline: "none",
                      }}
                    />
                    <p style={hintStyle}>How many units</p>
                  </div>
                  <div>
                    <label style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "var(--white-faint)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)", display: "block", marginBottom: "var(--space-1)" }}>
                      Unit cost (net)
                    </label>
                    <CurrencyInput
                      value={item.unit_cost}
                      onChange={(p) => updateItem(i, "unit_cost", p ?? 0)}
                    />
                    <p style={hintStyle}>Price per single unit, before VAT</p>
                  </div>
                  <div>
                    <label style={{ fontFamily: "var(--font-montserrat)", fontSize: "10px", color: "var(--white-faint)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)", display: "block", marginBottom: "var(--space-1)" }}>
                      VAT per line
                    </label>
                    <CurrencyInput
                      value={item.vat_amount}
                      onChange={(p) => updateItem(i, "vat_amount", p ?? 0)}
                    />
                    <p style={hintStyle}>
                      Total VAT for this line (usually 20% × qty × unit cost)
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-4 space-y-1 text-right" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)" }}>
            <div>Subtotal: <span style={{ color: "var(--white)" }}>{formatPrice(subtotal)}</span></div>
            <div>VAT: <span style={{ color: "var(--white)" }}>{formatPrice(vatTotal)}</span></div>
            <div>Shipping: <span style={{ color: "var(--white)" }}>{formatPrice(shippingCost)}</span></div>
            <div className="text-base">Total: <span style={{ color: "var(--gold-dark)", fontWeight: 700 }}>{formatPrice(total)}</span></div>
          </div>
        )}
      </div>

      <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
        <label style={labelStyle}>Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={inputStyle} />
      </div>

      <button onClick={handleSubmit} disabled={submitting} className="self-start rounded-md px-6 py-3 disabled:opacity-50" style={{ background: "var(--gold)", color: "#FFFFFF", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}>
        {submitting ? "Creating..." : "Create Draft PO"}
      </button>
    </div>
  );
}
