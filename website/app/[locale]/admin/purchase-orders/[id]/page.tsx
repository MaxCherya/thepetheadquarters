"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Package, XCircle } from "lucide-react";
import { toast } from "@heroui/react";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import { ConfirmModal } from "../../_components/confirm-modal";

interface POItem {
  id: string;
  variant: string;
  variant_sku: string;
  product_name: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  vat_amount: number;
  line_total: number;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier: string;
  supplier_name: string;
  supplier_email: string;
  status: string;
  expected_date: string | null;
  sent_at: string | null;
  received_at: string | null;
  cancelled_at: string | null;
  supplier_invoice_number: string;
  subtotal: number;
  vat_amount: number;
  shipping_cost: number;
  total: number;
  notes: string;
  items: POItem[];
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft: { bg: "rgba(102,102,102,0.1)", color: "var(--white-faint)" },
  sent: { bg: "rgba(21,101,192,0.1)", color: "var(--info)" },
  partial: { bg: "rgba(230,81,0,0.1)", color: "var(--warning)" },
  received: { bg: "rgba(46,125,50,0.1)", color: "var(--success)" },
  cancelled: { bg: "rgba(198,40,40,0.08)", color: "var(--error)" },
};

function formatPrice(p: number): string { return `£${(p / 100).toFixed(2)}`; }
function formatDate(s: string | null): string { if (!s) return "—"; return new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }

export default function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReceive, setShowReceive] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [receiveQty, setReceiveQty] = useState<Record<string, number>>({});

  function load() {
    apiClient.get<{ status: string; data: PurchaseOrder }>(endpoints.admin.purchaseOrders.detail(id))
      .then((r) => {
        setPo(r.data);
        // Pre-populate with outstanding quantities
        const init: Record<string, number> = {};
        r.data.items.forEach((it) => {
          init[it.id] = it.quantity_ordered - it.quantity_received;
        });
        setReceiveQty(init);
      })
      .catch(() => setPo(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  async function handleSend() {
    setActionLoading(true);
    try {
      await apiClient.post(endpoints.admin.purchaseOrders.send(id), {});
      toast.success("Marked as sent");
      load();
    } catch {
      toast.danger("Failed to send");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReceive() {
    setActionLoading(true);
    try {
      const items = Object.entries(receiveQty)
        .filter(([_, qty]) => qty > 0)
        .map(([po_item_id, quantity_received]) => ({ po_item_id, quantity_received }));

      if (items.length === 0) {
        toast.danger("Enter at least one quantity to receive");
        setActionLoading(false);
        return;
      }

      await apiClient.post(endpoints.admin.purchaseOrders.receive(id), { items });
      toast.success("Stock received");
      setShowReceive(false);
      load();
    } catch {
      toast.danger("Failed to receive");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    setActionLoading(true);
    try {
      await apiClient.post(endpoints.admin.purchaseOrders.cancel(id), {});
      toast.success("Cancelled");
      load();
    } catch {
      toast.danger("Failed to cancel");
    } finally {
      setActionLoading(false);
      setConfirmCancel(false);
    }
  }

  function generateMailto() {
    if (!po) return "#";
    const subject = `Purchase Order ${po.po_number}`;
    const lines = po.items.map(
      (i) => `- ${i.product_name} (${i.variant_sku}): qty ${i.quantity_ordered} @ ${formatPrice(i.unit_cost)} = ${formatPrice(i.line_total)}`,
    );
    const body = `Hi ${po.supplier_name},\n\nPlease find our purchase order below:\n\nPO Number: ${po.po_number}\nExpected Date: ${formatDate(po.expected_date)}\n\nItems:\n${lines.join("\n")}\n\nSubtotal: ${formatPrice(po.subtotal)}\nVAT: ${formatPrice(po.vat_amount)}\nShipping: ${formatPrice(po.shipping_cost)}\nTotal: ${formatPrice(po.total)}\n\n${po.notes ? `Notes: ${po.notes}\n\n` : ""}Thanks,\nThe Pet Headquarters`;
    return `mailto:${po.supplier_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  if (loading) {
    return <div className="flex justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full" style={{ border: "2px solid var(--bg-border)", borderTopColor: "var(--gold)" }} /></div>;
  }

  if (!po) {
    return <div className="rounded-lg py-16 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}><p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>PO not found.</p></div>;
  }

  const colors = STATUS_COLORS[po.status] || STATUS_COLORS.draft;
  const canSend = po.status === "draft";
  const canReceive = po.status === "sent" || po.status === "partial";
  const canCancel = po.status === "draft" || po.status === "sent";

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/purchase-orders" className="inline-flex w-fit items-center gap-2 transition-colors duration-200 hover:text-[var(--gold)]" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" }}>
        <ArrowLeft size={14} /> Back
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)" }}>
            {po.po_number}
          </h1>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>
            <Link href={`/admin/suppliers/${po.supplier}`} style={{ color: "var(--gold-dark)" }}>{po.supplier_name}</Link>
            {po.expected_date && ` · Expected ${formatDate(po.expected_date)}`}
          </p>
        </div>
        <span className="rounded-full px-3 py-1" style={{ background: colors.bg, color: colors.color, fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>
          {po.status}
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {canSend && (
          <>
            <a href={generateMailto()} className="flex items-center gap-2 rounded-md px-4 py-2.5" style={{ border: "1px solid var(--bg-border)", color: "var(--white-dim)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)" }}>
              📧 Email Supplier
            </a>
            <button onClick={handleSend} disabled={actionLoading} className="flex items-center gap-2 rounded-md px-4 py-2.5 disabled:opacity-50" style={{ background: "var(--gold)", color: "#FFFFFF", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}>
              <Send size={14} />
              Mark as Sent
            </button>
          </>
        )}
        {canReceive && (
          <button onClick={() => setShowReceive(true)} className="flex items-center gap-2 rounded-md px-4 py-2.5" style={{ background: "var(--gold)", color: "#FFFFFF", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}>
            <Package size={14} />
            Receive Stock
          </button>
        )}
        {canCancel && (
          <button onClick={() => setConfirmCancel(true)} className="flex items-center gap-2 rounded-md px-4 py-2.5" style={{ border: "1px solid var(--error)", color: "var(--error)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)" }}>
            <XCircle size={14} /> Cancel
          </button>
        )}
      </div>

      {/* Items */}
      <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
        <h2 className="mb-4" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-medium)", color: "var(--white-faint)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>
          Items ({po.items.length})
        </h2>
        <div className="flex flex-col gap-3">
          {po.items.map((item, i) => (
            <div key={item.id} className="flex items-center justify-between" style={{ paddingBottom: i < po.items.length - 1 ? "var(--space-3)" : 0, borderBottom: i < po.items.length - 1 ? "1px solid var(--bg-border)" : "none" }}>
              <div className="flex-1">
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--white)" }}>
                  {item.product_name}
                </p>
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
                  {item.variant_sku} · Received {item.quantity_received}/{item.quantity_ordered}
                </p>
              </div>
              <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--white)" }}>
                {formatPrice(item.line_total)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between"><span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>Subtotal</span><span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white)" }}>{formatPrice(po.subtotal)}</span></div>
          <div className="flex justify-between"><span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>VAT</span><span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white)" }}>{formatPrice(po.vat_amount)}</span></div>
          <div className="flex justify-between"><span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>Shipping</span><span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white)" }}>{formatPrice(po.shipping_cost)}</span></div>
          <div className="flex justify-between" style={{ paddingTop: "var(--space-2)", borderTop: "1px solid var(--bg-border)" }}>
            <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--white)" }}>Total</span>
            <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-base)", fontWeight: "var(--weight-bold)", color: "var(--gold-dark)" }}>{formatPrice(po.total)}</span>
          </div>
        </div>
      </div>

      {/* Receive modal */}
      {showReceive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowReceive(false)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg" onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)", margin: "var(--space-4)" }}>
            <h2 className="mb-4" style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-2xl)", color: "var(--white)" }}>Receive Stock</h2>
            <p className="mb-6" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>
              Enter quantities received. Stock batches will be created with FIFO cost basis.
            </p>
            <div className="flex flex-col gap-3">
              {po.items.map((item) => {
                const outstanding = item.quantity_ordered - item.quantity_received;
                return (
                  <div key={item.id} className="flex items-center justify-between gap-4" style={{ padding: "var(--space-3)", background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)" }}>
                    <div className="flex-1">
                      <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white)", fontWeight: "var(--weight-medium)" }}>{item.product_name}</p>
                      <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
                        Outstanding: {outstanding} of {item.quantity_ordered}
                      </p>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={outstanding}
                      value={receiveQty[item.id] || 0}
                      onChange={(e) => setReceiveQty({ ...receiveQty, [item.id]: parseInt(e.target.value) || 0 })}
                      style={{ width: "80px", background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", color: "var(--white)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", borderRadius: "var(--radius-md)", padding: "var(--space-2)", textAlign: "center", outline: "none" }}
                      disabled={outstanding === 0}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowReceive(false)} className="rounded-md px-5 py-2.5" style={{ border: "1px solid var(--bg-border)", color: "var(--white-dim)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)" }}>Cancel</button>
              <button onClick={handleReceive} disabled={actionLoading} className="rounded-md px-5 py-2.5 disabled:opacity-50" style={{ background: "var(--gold)", color: "#FFFFFF", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}>
                {actionLoading ? "..." : "Confirm Receipt"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal open={confirmCancel} title="Cancel PO?" message="This will mark the purchase order as cancelled." confirmLabel="Cancel PO" destructive loading={actionLoading} onConfirm={handleCancel} onCancel={() => setConfirmCancel(false)} />
    </div>
  );
}
