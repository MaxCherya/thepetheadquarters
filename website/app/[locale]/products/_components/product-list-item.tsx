import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/types/product";

interface ProductListItemProps {
  product: Product;
}

function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function ProductListItem({ product }: ProductListItemProps) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="card-hover group flex gap-4 overflow-hidden rounded-lg sm:gap-6"
      style={{ background: "var(--bg-secondary)" }}
    >
      {/* Image */}
      <div
        className="relative h-32 w-32 shrink-0 overflow-hidden sm:h-44 sm:w-44"
        style={{ borderRadius: "var(--radius-lg) 0 0 var(--radius-lg)" }}
      >
        {product.primary_image ? (
          <Image
            src={product.primary_image}
            alt={product.name}
            fill
            sizes="176px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              background: "var(--bg-tertiary)",
              color: "var(--white-faint)",
              fontSize: "var(--text-sm)",
            }}
          >
            No Image
          </div>
        )}

        {!product.in_stock && (
          <span
            className="absolute left-2 top-2 rounded-full px-2 py-0.5"
            style={{
              background: "var(--error)",
              color: "var(--white)",
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-xs)",
              fontWeight: "var(--weight-medium)",
            }}
          >
            Out of Stock
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-center py-3 pr-4 sm:py-4 sm:pr-6">
        <h3
          className="mb-1 line-clamp-2 sm:mb-2"
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "clamp(1rem, 2vw, 1.5rem)",
            fontWeight: "var(--weight-medium)",
            color: "var(--white)",
            lineHeight: "var(--leading-tight)",
          }}
        >
          {product.name}
        </h3>

        {product.short_description && (
          <p
            className="mb-2 line-clamp-2 hidden sm:block"
            style={{
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-sm)",
              color: "var(--white-dim)",
              lineHeight: "var(--leading-normal)",
            }}
          >
            {product.short_description}
          </p>
        )}

        {product.average_rating > 0 && (
          <div
            className="mb-2 flex items-center gap-1"
            style={{
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-xs)",
              color: "var(--gold)",
            }}
          >
            <span>★ {product.average_rating}</span>
            <span style={{ color: "var(--white-faint)" }}>({product.review_count})</span>
          </div>
        )}

        <div className="flex items-baseline gap-2">
          {product.min_price !== null && (
            <span
              style={{
                fontFamily: "var(--font-montserrat)",
                fontSize: "clamp(1rem, 2vw, 1.25rem)",
                fontWeight: "var(--weight-semibold)",
                color: "var(--white)",
              }}
            >
              {product.min_price === product.max_price
                ? formatPrice(product.min_price)
                : `${formatPrice(product.min_price)} – ${formatPrice(product.max_price!)}`}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
