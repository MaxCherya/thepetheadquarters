import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/types/product";
import { StarRating } from "@/components/ui/star-rating";

interface ProductCardProps {
  product: Product;
}

function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="card-hover group block overflow-hidden rounded-lg"
      style={{ background: "var(--bg-secondary)" }}
    >
      <div
        className="relative aspect-square overflow-hidden"
        style={{ borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }}
      >
        {product.primary_image ? (
          <Image
            src={product.primary_image}
            alt={product.primary_image_alt || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
            className="absolute left-2 top-2 rounded-full px-2 py-0.5 sm:left-3 sm:top-3 sm:px-3 sm:py-1"
            style={{
              background: "var(--error)",
              color: "#FFFFFF",
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-xs)",
              fontWeight: "var(--weight-medium)",
            }}
          >
            Out of Stock
          </span>
        )}
      </div>

      <div className="p-3 sm:p-4">
        <h3
          className="mb-1 line-clamp-2 sm:mb-2"
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "clamp(0.875rem, 2vw, 1.25rem)",
            fontWeight: "var(--weight-medium)",
            color: "var(--white)",
            lineHeight: "var(--leading-tight)",
          }}
        >
          {product.name}
        </h3>

        {product.average_rating > 0 && (
          <div className="mb-1 sm:mb-2">
            <StarRating
              rating={Number(product.average_rating)}
              size={12}
              reviewCount={product.review_count}
            />
          </div>
        )}

        <div className="flex items-baseline gap-2">
          {product.min_price !== null && (
            <span
              style={{
                fontFamily: "var(--font-montserrat)",
                fontSize: "clamp(0.875rem, 2vw, 1.125rem)",
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
