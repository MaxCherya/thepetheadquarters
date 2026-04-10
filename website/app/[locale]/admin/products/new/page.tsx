"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "@heroui/react";
import { useCreateProduct } from "@/hooks/use-admin-products";
import { useAdminBrands, useAdminCategories } from "@/hooks/use-admin-catalog";
import { HtmlEditor } from "../../_components/html-editor";

export default function NewProductPage() {
  const router = useRouter();
  const { data: brands = [] } = useAdminBrands();
  const { data: categories = [] } = useAdminCategories();
  const createMutation = useCreateProduct();

  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [brandId, setBrandId] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<"self" | "dropship">("self");
  const [isFeatured, setIsFeatured] = useState(false);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.danger("Name required");
      return;
    }
    try {
      const product = await createMutation.mutateAsync({
        name,
        description,
        short_description: shortDescription,
        brand_id: brandId || null,
        fulfillment_type: fulfillmentType,
        is_featured: isFeatured,
        is_active: true,
        category_ids: categoryIds,
      });
      toast.success("Product created");
      router.push(`/admin/products/${product.id}`);
    } catch {
      toast.danger("Failed to create");
    }
  }

  const labelStyle = { fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)" as const, fontWeight: "var(--weight-medium)" as const, color: "var(--white-dim)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, display: "block" as const, marginBottom: "var(--space-2)" };
  const inputStyle = { background: "var(--bg-tertiary)", border: "1px solid var(--bg-border)", color: "var(--white)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)", width: "100%" };
  const hintStyle = { fontFamily: "var(--font-montserrat)", fontSize: "11px" as const, color: "var(--white-faint)", marginTop: "var(--space-1)", lineHeight: "var(--leading-relaxed)" as const };

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/products" className="inline-flex w-fit items-center gap-2 transition-colors duration-200 hover:text-[var(--gold)]" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" }}>
        <ArrowLeft size={14} /> Back to products
      </Link>

      <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)" }}>
        New Product
      </h1>

      <form onSubmit={handleSubmit} className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
        <div className="flex flex-col gap-5">
          <div>
            <label style={labelStyle}>Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
            <p style={hintStyle}>The product title customers see, e.g. &quot;Royal Canin Adult Dry Dog Food&quot;</p>
          </div>

          <div>
            <label style={labelStyle}>Short description</label>
            <input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} style={inputStyle} />
            <p style={hintStyle}>One-liner shown on product cards in the listing (keep it short)</p>
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <HtmlEditor value={description} onChange={setDescription} rows={8} placeholder="<h3>Wholesome Nutrition</h3><p>Made with...</p><ul><li>Feature 1</li></ul>" />
            <p style={hintStyle}>
              Full description shown on the product page. HTML allowed (use &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;&lt;li&gt; for structure). Click Preview to see how it&apos;ll look to customers.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label style={labelStyle}>Brand</label>
              <select value={brandId} onChange={(e) => setBrandId(e.target.value)} style={inputStyle}>
                <option value="">— None —</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <p style={hintStyle}>Who makes the product (optional)</p>
            </div>
            <div>
              <label style={labelStyle}>Fulfillment</label>
              <select value={fulfillmentType} onChange={(e) => setFulfillmentType(e.target.value as "self" | "dropship")} style={inputStyle}>
                <option value="self">Self-fulfilled</option>
                <option value="dropship">Dropship</option>
              </select>
              <p style={hintStyle}>
                Self = you stock and ship it. Dropship = supplier ships directly to customer (no stock held).
              </p>
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
                    className="rounded-full px-3 py-1.5"
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
            <p style={hintStyle}>Pick at least one category so customers can find this product</p>
          </div>

          <div>
            <label className="flex items-center gap-2" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)" }}>
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} style={{ accentColor: "var(--gold)" }} />
              Featured
            </label>
            <p style={hintStyle}>Featured products appear on the homepage</p>
          </div>

          <button type="submit" disabled={createMutation.isPending} className="self-start rounded-md px-6 py-3 disabled:opacity-50" style={{ background: "var(--gold)", color: "#FFFFFF", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}>
            {createMutation.isPending ? "Creating..." : "Create Product"}
          </button>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
            After creation you can add variants and images.
          </p>
        </div>
      </form>
    </div>
  );
}
