import type { Product } from "@/types/product";
import { ProductCard } from "../../../_components/product-card";

interface RelatedProductsProps {
  products: Product[];
  title: string;
}

export function RelatedProducts({ products, title }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="mt-16 pt-12" style={{ borderTop: "1px solid var(--bg-border)" }}>
      <h2
        className="mb-8 text-center"
        style={{
          fontFamily: "var(--font-cormorant)",
          fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
          fontWeight: "var(--weight-regular)",
          color: "var(--white)",
          letterSpacing: "var(--tracking-tight)",
        }}
      >
        {title}
      </h2>
      <div
        className="mx-auto mb-8"
        style={{ width: 60, height: 1, background: "var(--gold)" }}
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4" data-animate="stagger">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
