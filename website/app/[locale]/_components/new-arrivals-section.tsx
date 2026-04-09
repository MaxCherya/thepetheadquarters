import type { Product } from "@/types/product";
import { ProductCard } from "./product-card";

interface NewArrivalsSectionProps {
  dict: {
    label: string;
    title: string;
  };
  products: Product[];
}

export function NewArrivalsSection({ dict, products }: NewArrivalsSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-16 md:py-24" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 text-center md:mb-12" data-animate="fade-up">
          <span
            className="mb-4 block"
            style={{
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-xs)",
              letterSpacing: "var(--tracking-widest)",
              textTransform: "uppercase",
              color: "var(--gold-dark)",
            }}
          >
            {dict.label}
          </span>
          <h2
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
              fontWeight: "var(--weight-regular)",
              color: "var(--white)",
              letterSpacing: "var(--tracking-tight)",
            }}
          >
            {dict.title}
          </h2>
          <div
            className="mx-auto mt-4"
            data-animate="divider"
            style={{ width: 60, height: 1, background: "var(--gold)" }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4" data-animate="stagger">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
