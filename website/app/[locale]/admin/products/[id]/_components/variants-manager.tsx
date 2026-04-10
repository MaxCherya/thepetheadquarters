"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "@heroui/react";
import {
  useCreateVariant,
  useDeleteVariant,
  useUpdateVariant,
  type AdminVariant,
} from "@/hooks/use-admin-products";
import { ConfirmModal } from "../../../_components/confirm-modal";
import { CurrencyInput } from "../../../_components/currency-input";

interface VariantsManagerProps {
  productId: string;
  variants: AdminVariant[];
}

interface VariantRow {
  id?: string;
  sku: string;
  price: number;
  compare_at_price: number | null;
  cost_price: number | null;
  stock_quantity: number;
  weight_grams: number | null;
  sort_order: number;
  is_active: boolean;
}

function emptyRow(sortOrder: number): VariantRow {
  return {
    sku: "",
    price: 0,
    compare_at_price: null,
    cost_price: null,
    stock_quantity: 0,
    weight_grams: null,
    sort_order: sortOrder,
    is_active: true,
  };
}

export function VariantsManager({ productId, variants }: VariantsManagerProps) {
  const createMutation = useCreateVariant(productId);
  const deleteMutation = useDeleteVariant(productId);

  const [editing, setEditing] = useState<VariantRow | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminVariant | null>(null);

  const updateMutation = useUpdateVariant(productId, editingId || "");

  function startCreate() {
    setEditingId(null);
    setEditing(emptyRow(variants.length));
  }

  function startEdit(v: AdminVariant) {
    setEditingId(v.id);
    setEditing({
      sku: v.sku,
      price: v.price,
      compare_at_price: v.compare_at_price,
      cost_price: v.cost_price,
      stock_quantity: v.stock_quantity,
      weight_grams: v.weight_grams,
      sort_order: v.sort_order,
      is_active: v.is_active,
    });
  }

  async function handleSave() {
    if (!editing) return;
    if (!editing.sku.trim() || editing.price <= 0) {
      toast.danger("SKU and price required");
      return;
    }
    try {
      if (editingId) {
        await updateMutation.mutateAsync(editing);
        toast.success("Variant updated");
      } else {
        await createMutation.mutateAsync(editing);
        toast.success("Variant added");
      }
      setEditing(null);
      setEditingId(null);
    } catch {
      toast.danger("Failed to save variant");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.id);
      toast.success("Variant deactivated");
    } catch {
      toast.danger("Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  const labelStyle = {
    fontFamily: "var(--font-montserrat)",
    fontSize: "var(--text-xs)" as const,
    color: "var(--white-dim)",
    letterSpacing: "var(--tracking-wide)",
    textTransform: "uppercase" as const,
    display: "block" as const,
    marginBottom: "var(--space-2)",
  };
  const inputStyle = {
    background: "var(--bg-tertiary)",
    border: "1px solid var(--bg-border)",
    color: "var(--white)",
    fontFamily: "var(--font-montserrat)",
    fontSize: "var(--text-sm)",
    borderRadius: "var(--radius-md)",
    padding: "var(--space-3) var(--space-4)",
    width: "100%",
  };
  const hintStyle = {
    fontFamily: "var(--font-montserrat)",
    fontSize: "11px" as const,
    color: "var(--white-faint)",
    marginTop: "var(--space-1)",
    lineHeight: "var(--leading-relaxed)" as const,
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col gap-4">
      {variants.length === 0 ? (
        <p
          className="rounded-lg py-12 text-center"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--bg-border)",
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-sm)",
            color: "var(--white-faint)",
          }}
        >
          No variants yet. Add one to make this product buyable.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
          {variants.map((v, i) => (
            <div
              key={v.id}
              className="flex items-center justify-between"
              style={{
                padding: "var(--space-4) var(--space-5)",
                borderBottom: i < variants.length - 1 ? "1px solid var(--bg-border)" : "none",
              }}
            >
              <div className="flex-1">
                <p
                  style={{
                    fontFamily: "var(--font-montserrat)",
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--weight-semibold)",
                    color: "var(--white)",
                  }}
                >
                  {v.sku} {!v.is_active && <span style={{ color: "var(--error)" }}>(inactive)</span>}
                </p>
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
                  Stock: {v.stock_quantity} · Cost: {v.cost_price ? `£${(v.cost_price / 100).toFixed(2)}` : "—"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  style={{
                    fontFamily: "var(--font-montserrat)",
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--weight-semibold)",
                    color: "var(--gold-dark)",
                    minWidth: "70px",
                    textAlign: "right",
                  }}
                >
                  £{(v.price / 100).toFixed(2)}
                </span>
                <button
                  onClick={() => startEdit(v)}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[rgba(187,148,41,0.1)]"
                  style={{ color: "var(--white-faint)" }}
                  aria-label="Edit variant"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setDeleting(v)}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[rgba(198,40,40,0.1)]"
                  style={{ color: "var(--white-faint)" }}
                  aria-label="Delete variant"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!editing && (
        <button
          onClick={startCreate}
          className="flex w-fit items-center gap-2 rounded-md px-4 py-2.5"
          style={{
            border: "1px solid var(--bg-border)",
            color: "var(--gold-dark)",
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--weight-medium)",
          }}
        >
          <Plus size={14} />
          Add Variant
        </button>
      )}

      {editing && (
        <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
          <h3 className="mb-4" style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-xl)", color: "var(--white)" }}>
            {editingId ? "Edit Variant" : "New Variant"}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label style={labelStyle}>SKU *</label>
              <input
                value={editing.sku}
                onChange={(e) => setEditing({ ...editing, sku: e.target.value })}
                style={inputStyle}
                placeholder="TPH-XXXXX"
              />
              <p style={hintStyle}>Unique product code, e.g. TPH-01099</p>
            </div>
            <div>
              <label style={labelStyle}>Stock Quantity</label>
              <input
                type="number"
                min={0}
                value={editing.stock_quantity}
                onChange={(e) => setEditing({ ...editing, stock_quantity: parseInt(e.target.value) || 0 })}
                style={inputStyle}
              />
              <p style={hintStyle}>How many units you have on hand</p>
            </div>
            <div>
              <label style={labelStyle}>Price *</label>
              <CurrencyInput
                value={editing.price}
                onChange={(p) => setEditing({ ...editing, price: p ?? 0 })}
              />
              <p style={hintStyle}>What customers pay (VAT included)</p>
            </div>
            <div>
              <label style={labelStyle}>Compare-at Price</label>
              <CurrencyInput
                value={editing.compare_at_price}
                allowNull
                onChange={(p) => setEditing({ ...editing, compare_at_price: p })}
              />
              <p style={hintStyle}>
                The crossed-out &quot;was&quot; price shown when on sale. Leave empty if not on sale.
              </p>
            </div>
            <div>
              <label style={labelStyle}>Cost Price</label>
              <CurrencyInput
                value={editing.cost_price}
                allowNull
                onChange={(p) => setEditing({ ...editing, cost_price: p })}
              />
              <p style={hintStyle}>
                What you paid the supplier per unit (net of VAT). Used for profit reports — never shown to customers.
              </p>
            </div>
            <div>
              <label style={labelStyle}>Weight (grams)</label>
              <input
                type="number"
                min={0}
                value={editing.weight_grams ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, weight_grams: e.target.value ? parseInt(e.target.value) : null })
                }
                style={inputStyle}
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)" }}>
                <input
                  type="checkbox"
                  checked={editing.is_active}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  style={{ accentColor: "var(--gold)" }}
                />
                Active (visible in store)
              </label>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="rounded-md px-5 py-2.5 disabled:opacity-50"
              style={{
                background: "var(--gold)",
                color: "#FFFFFF",
                fontFamily: "var(--font-montserrat)",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--weight-semibold)",
              }}
            >
              {isPending ? "..." : editingId ? "Save Changes" : "Add Variant"}
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setEditingId(null);
              }}
              className="rounded-md px-5 py-2.5"
              style={{
                border: "1px solid var(--bg-border)",
                color: "var(--white-dim)",
                fontFamily: "var(--font-montserrat)",
                fontSize: "var(--text-sm)",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleting}
        title="Deactivate Variant?"
        message={`This will hide ${deleting?.sku} from the storefront.`}
        confirmLabel="Deactivate"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
