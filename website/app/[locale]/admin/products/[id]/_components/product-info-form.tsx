"use client";

import { useEffect, useState } from "react";
import type { AdminProductDetail } from "@/hooks/use-admin-products";
import type { AdminBrand, AdminCategory } from "@/hooks/use-admin-catalog";
import { HtmlEditor } from "../../../_components/html-editor";

interface ProductInfoFormProps {
  product: AdminProductDetail;
  brands: AdminBrand[];
  categories: AdminCategory[];
  onSave: (data: {
    name: string;
    description: string;
    short_description: string;
    brand_id: string | null;
    fulfillment_type: "self" | "dropship";
    is_featured: boolean;
    is_active: boolean;
    category_ids: string[];
  }) => Promise<void>;
  saving: boolean;
}

export function ProductInfoForm({ product, brands, categories, onSave, saving }: ProductInfoFormProps) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [shortDescription, setShortDescription] = useState(product.short_description);
  const [brandId, setBrandId] = useState<string>(product.brand_id || "");
  const [fulfillmentType, setFulfillmentType] = useState<"self" | "dropship">(product.fulfillment_type as "self" | "dropship");
  const [isFeatured, setIsFeatured] = useState(product.is_featured);
  const [isActive, setIsActive] = useState(product.is_active);
  const [categoryIds, setCategoryIds] = useState<string[]>(product.category_ids);

  useEffect(() => {
    setName(product.name);
    setDescription(product.description);
    setShortDescription(product.short_description);
    setBrandId(product.brand_id || "");
    setFulfillmentType(product.fulfillment_type as "self" | "dropship");
    setIsFeatured(product.is_featured);
    setIsActive(product.is_active);
    setCategoryIds(product.category_ids);
  }, [product]);

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      name,
      description,
      short_description: shortDescription,
      brand_id: brandId || null,
      fulfillment_type: fulfillmentType,
      is_featured: isFeatured,
      is_active: isActive,
      category_ids: categoryIds,
    });
  }

  const labelStyle = { fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)" as const, fontWeight: "var(--weight-medium)" as const, color: "var(--white-dim)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, display: "block" as const, marginBottom: "var(--space-2)" };
  const inputStyle = { background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", color: "var(--white)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)", width: "100%" };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
      <div className="flex flex-col gap-5">
        <div>
          <label style={labelStyle}>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Short description</label>
          <input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Description</label>
          <HtmlEditor value={description} onChange={setDescription} rows={8} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label style={labelStyle}>Brand</label>
            <select value={brandId} onChange={(e) => setBrandId(e.target.value)} style={inputStyle}>
              <option value="">— None —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Fulfillment</label>
            <select value={fulfillmentType} onChange={(e) => setFulfillmentType(e.target.value as "self" | "dropship")} style={inputStyle}>
              <option value="self">Self-fulfilled</option>
              <option value="dropship">Dropship</option>
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Categories</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const selected = categoryIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCategory(c.id)}
                  className="rounded-full px-3 py-1.5 transition-colors duration-200"
                  style={{
                    background: selected ? "rgba(187,148,41,0.15)" : "var(--bg-tertiary)",
                    border: `1px solid ${selected ? "var(--gold)" : "var(--bg-border)"}`,
                    color: selected ? "var(--gold-dark)" : "var(--white-dim)",
                    fontFamily: "var(--font-montserrat)",
                    fontSize: "var(--text-xs)",
                    fontWeight: selected ? "var(--weight-semibold)" : "var(--weight-regular)",
                  }}
                >
                  {"  ".repeat(c.depth)}{c.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)" }}>
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} style={{ accentColor: "var(--gold)" }} />
            Featured
          </label>
          <label className="flex items-center gap-2" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)" }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ accentColor: "var(--gold)" }} />
            Active
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-md px-6 py-3 disabled:opacity-50"
          style={{ background: "var(--gold)", color: "#FFFFFF", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
