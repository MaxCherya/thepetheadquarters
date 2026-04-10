"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type {
  AdminPromotion,
  PromotionDiscountType,
  PromotionScope,
  PromotionSource,
} from "@/types/admin";
import type { PromotionFormData } from "@/hooks/use-admin-promotions";
import { useAdminBrands, useAdminCategories } from "@/hooks/use-admin-catalog";

interface PromotionFormProps {
  initial?: AdminPromotion;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (data: PromotionFormData) => void;
  onCancel: () => void;
}

const labelStyle = {
  fontFamily: "var(--font-montserrat)",
  fontSize: "var(--text-xs)" as const,
  fontWeight: "var(--weight-medium)" as const,
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
} as const;

const hintStyle = {
  fontFamily: "var(--font-montserrat)",
  fontSize: "11px" as const,
  color: "var(--white-faint)",
  marginTop: "var(--space-1)",
  lineHeight: "var(--leading-relaxed)" as const,
};

function toLocalDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  // YYYY-MM-DDTHH:MM (form input format)
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalDateTime(s: string): string | null {
  if (!s) return null;
  return new Date(s).toISOString();
}

export function PromotionForm({ initial, submitting, submitLabel, onSubmit, onCancel }: PromotionFormProps) {
  const { data: brands } = useAdminBrands();
  const { data: categories } = useAdminCategories();

  const [code, setCode] = useState(initial?.code || "");
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [discountType, setDiscountType] = useState<PromotionDiscountType>(initial?.discount_type || "percent");
  const [discountValue, setDiscountValue] = useState<string>(String(initial?.discount_value ?? 10));
  const [scope, setScope] = useState<PromotionScope>(initial?.scope || "all");
  const [scopeCategoryIds, setScopeCategoryIds] = useState<string[]>(initial?.scope_category_ids || []);
  const [scopeBrandIds, setScopeBrandIds] = useState<string[]>(initial?.scope_brand_ids || []);
  const [scopeProductIds, setScopeProductIds] = useState<string[]>(initial?.scope_product_ids || []);
  const [minSubtotal, setMinSubtotal] = useState<string>(
    initial?.min_subtotal ? (initial.min_subtotal / 100).toFixed(2) : "",
  );
  const [isFirstOrderOnly, setIsFirstOrderOnly] = useState(initial?.is_first_order_only || false);
  const [isOnePerCustomer, setIsOnePerCustomer] = useState(initial?.is_one_per_customer || false);
  const [startsAt, setStartsAt] = useState(toLocalDateTime(initial?.starts_at));
  const [endsAt, setEndsAt] = useState(toLocalDateTime(initial?.ends_at));
  const [maxUsesTotal, setMaxUsesTotal] = useState<string>(initial?.max_uses_total?.toString() || "");
  const [maxUsesPerUser, setMaxUsesPerUser] = useState<string>(initial?.max_uses_per_user?.toString() || "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [source, setSource] = useState<PromotionSource>(initial?.source || "manual");
  const [campaignLabel, setCampaignLabel] = useState(initial?.campaign_label || "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data: PromotionFormData = {
      code: code.trim() || undefined,
      name: name.trim(),
      description,
      discount_type: discountType,
      discount_value: discountType === "percent" ? parseInt(discountValue, 10) || 0 : 0,
      scope,
      scope_category_ids: scope === "category" ? scopeCategoryIds : [],
      scope_brand_ids: scope === "brand" ? scopeBrandIds : [],
      scope_product_ids: scope === "product" ? scopeProductIds : [],
      min_subtotal: minSubtotal ? Math.round(parseFloat(minSubtotal) * 100) : 0,
      is_first_order_only: isFirstOrderOnly,
      is_one_per_customer: isOnePerCustomer,
      starts_at: fromLocalDateTime(startsAt),
      ends_at: fromLocalDateTime(endsAt),
      max_uses_total: maxUsesTotal ? parseInt(maxUsesTotal, 10) : null,
      max_uses_per_user: maxUsesPerUser ? parseInt(maxUsesPerUser, 10) : null,
      is_active: isActive,
      source,
      campaign_label: campaignLabel,
    };

    onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Identification */}
      <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
        <h2 className="mb-4" style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-xl)", color: "var(--white)" }}>
          Identification
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label style={labelStyle}>Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. WELCOME10 (auto if blank)"
              style={inputStyle}
            />
            <p style={hintStyle}>
              The text customers type at checkout. Leave blank to auto-generate. Case-insensitive on lookup.
            </p>
          </div>
          <div>
            <label style={labelStyle}>Internal name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First-order welcome 10%"
              required
              style={inputStyle}
            />
            <p style={hintStyle}>For your eyes only. Helps you find this code later.</p>
          </div>
          <div className="md:col-span-2">
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ ...inputStyle, fontFamily: "var(--font-montserrat)" }}
              placeholder="Notes for yourself: who created this, why, when…"
            />
            <p style={hintStyle}>Internal notes — never shown to customers.</p>
          </div>
        </div>
      </div>

      {/* Discount */}
      <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
        <h2 className="mb-4" style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-xl)", color: "var(--white)" }}>
          Discount
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label style={labelStyle}>Type *</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as PromotionDiscountType)}
              style={inputStyle}
            >
              <option value="percent">Percentage off eligible items</option>
              <option value="free_shipping">Free shipping</option>
            </select>
            <p style={hintStyle}>
              <strong>Percent</strong> reduces the cart by a % of the eligible items.{" "}
              <strong>Free shipping</strong> waives the delivery fee entirely.
            </p>
          </div>
          {discountType === "percent" && (
            <div>
              <label style={labelStyle}>Percent off *</label>
              <input
                type="number"
                min={1}
                max={100}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                required
                style={inputStyle}
              />
              <p style={hintStyle}>Whole number between 1 and 100. Example: 10 for 10% off.</p>
            </div>
          )}
        </div>
      </div>

      {/* Scope */}
      <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
        <h2 className="mb-4" style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-xl)", color: "var(--white)" }}>
          Scope
        </h2>
        <div className="grid gap-4">
          <div>
            <label style={labelStyle}>Applies to *</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as PromotionScope)}
              style={inputStyle}
            >
              <option value="all">Whole cart</option>
              <option value="category">Specific categories</option>
              <option value="brand">Specific brands</option>
              <option value="product">Specific products</option>
            </select>
            <p style={hintStyle}>
              Limits which items the discount applies to. The cart still has to meet the minimum subtotal below.
            </p>
          </div>

          {scope === "category" && (
            <div>
              <label style={labelStyle}>Categories</label>
              <select
                multiple
                value={scopeCategoryIds}
                onChange={(e) =>
                  setScopeCategoryIds(Array.from(e.target.selectedOptions, (o) => o.value))
                }
                style={{ ...inputStyle, height: "200px" }}
              >
                {(categories || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {"— ".repeat(c.depth || 0)}{c.name}
                  </option>
                ))}
              </select>
              <p style={hintStyle}>Hold Ctrl/Cmd to select multiple.</p>
            </div>
          )}

          {scope === "brand" && (
            <div>
              <label style={labelStyle}>Brands</label>
              <select
                multiple
                value={scopeBrandIds}
                onChange={(e) =>
                  setScopeBrandIds(Array.from(e.target.selectedOptions, (o) => o.value))
                }
                style={{ ...inputStyle, height: "200px" }}
              >
                {(brands || []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <p style={hintStyle}>Hold Ctrl/Cmd to select multiple.</p>
            </div>
          )}

          {scope === "product" && (
            <div>
              <label style={labelStyle}>Product IDs</label>
              <textarea
                value={scopeProductIds.join("\n")}
                onChange={(e) =>
                  setScopeProductIds(
                    e.target.value
                      .split(/[\s,]+/)
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
                rows={4}
                style={{ ...inputStyle, fontFamily: "monospace" }}
                placeholder="One UUID per line"
              />
              <p style={hintStyle}>
                Paste product UUIDs (one per line). You can find them on the product detail page in the URL.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Eligibility */}
      <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
        <h2 className="mb-4" style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-xl)", color: "var(--white)" }}>
          Who can use it
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label style={labelStyle}>Minimum cart subtotal (£)</label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={minSubtotal}
              onChange={(e) => setMinSubtotal(e.target.value)}
              placeholder="e.g. 25.00"
              style={inputStyle}
            />
            <p style={hintStyle}>Customer must have at least this much in their cart. Leave blank for no minimum.</p>
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)" }}>
              <input
                type="checkbox"
                checked={isFirstOrderOnly}
                onChange={(e) => setIsFirstOrderOnly(e.target.checked)}
                style={{ accentColor: "var(--gold)" }}
              />
              First order only
            </label>
            <p style={hintStyle}>Customer must have zero prior non-cancelled orders.</p>

            <label className="flex items-center gap-3" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)" }}>
              <input
                type="checkbox"
                checked={isOnePerCustomer}
                onChange={(e) => setIsOnePerCustomer(e.target.checked)}
                style={{ accentColor: "var(--gold)" }}
              />
              One per customer
            </label>
            <p style={hintStyle}>Each user/email may only redeem this code once. Prevents reuse via different emails too.</p>
          </div>
        </div>
      </div>

      {/* Lifecycle */}
      <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
        <h2 className="mb-4" style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-xl)", color: "var(--white)" }}>
          When it&apos;s valid
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label style={labelStyle}>Starts at</label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              style={inputStyle}
            />
            <p style={hintStyle}>Leave blank to start immediately.</p>
          </div>
          <div>
            <label style={labelStyle}>Ends at</label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              style={inputStyle}
            />
            <p style={hintStyle}>Leave blank for no expiry.</p>
          </div>
          <div>
            <label style={labelStyle}>Max uses (global)</label>
            <input
              type="number"
              min={1}
              value={maxUsesTotal}
              onChange={(e) => setMaxUsesTotal(e.target.value)}
              placeholder="Unlimited"
              style={inputStyle}
            />
            <p style={hintStyle}>Total times the code can be used across all customers. Leave blank for unlimited.</p>
          </div>
          <div>
            <label style={labelStyle}>Max uses per customer</label>
            <input
              type="number"
              min={1}
              value={maxUsesPerUser}
              onChange={(e) => setMaxUsesPerUser(e.target.value)}
              placeholder="Unlimited"
              style={inputStyle}
            />
            <p style={hintStyle}>How many times one customer can use it. Overrides &ldquo;one per customer&rdquo; if set.</p>
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-3" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)" }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ accentColor: "var(--gold)" }}
              />
              Active
            </label>
            <p style={hintStyle}>Inactive codes cannot be applied even if all other rules pass. Useful for pausing.</p>
          </div>
        </div>
      </div>

      {/* Attribution */}
      <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
        <h2 className="mb-4" style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-xl)", color: "var(--white)" }}>
          Attribution
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label style={labelStyle}>Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as PromotionSource)}
              style={inputStyle}
            >
              <option value="manual">Manual / one-off</option>
              <option value="newsletter">Newsletter signup</option>
              <option value="influencer">Influencer / partner</option>
              <option value="campaign">Marketing campaign</option>
              <option value="referral">Customer referral</option>
            </select>
            <p style={hintStyle}>Used to filter the promotions list and the reports later.</p>
          </div>
          <div>
            <label style={labelStyle}>Campaign label</label>
            <input
              value={campaignLabel}
              onChange={(e) => setCampaignLabel(e.target.value)}
              placeholder="e.g. instagram_oct_2026"
              style={inputStyle}
            />
            <p style={hintStyle}>Free-form tag for grouping codes from the same campaign or partner.</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-md px-5 py-2.5 disabled:opacity-50"
          style={{ background: "var(--gold)", color: "#FFFFFF", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}
        >
          <Sparkles size={14} />
          {submitting ? "Saving..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-5 py-2.5"
          style={{ border: "1px solid var(--bg-border)", color: "var(--white-dim)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
