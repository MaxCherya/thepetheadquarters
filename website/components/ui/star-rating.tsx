import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  showValue?: boolean;
  reviewCount?: number;
}

export function StarRating({
  rating,
  maxStars = 5,
  size = 14,
  showValue = true,
  reviewCount,
}: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const roundedUp = rating - fullStars >= 0.75;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }).map((_, i) => {
          const filled = i < fullStars || (i === fullStars && roundedUp);
          const half = i === fullStars && hasHalf;

          return (
            <span key={i} className="relative inline-flex" style={{ width: size, height: size }}>
              {/* Empty star (background) */}
              <Star
                size={size}
                style={{ color: "var(--bg-border)" }}
                fill="var(--bg-border)"
                className="absolute inset-0"
              />
              {/* Filled or half star */}
              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: half ? "50%" : "100%" }}
                >
                  <Star
                    size={size}
                    style={{ color: "var(--gold)" }}
                    fill="var(--gold)"
                  />
                </span>
              )}
            </span>
          );
        })}
      </div>

      {showValue && rating > 0 && (
        <span
          style={{
            fontFamily: "var(--font-montserrat)",
            fontSize: size <= 14 ? "var(--text-xs)" : "var(--text-sm)",
            fontWeight: 600,
            color: "var(--gold)",
          }}
        >
          {rating.toFixed(1)}
        </span>
      )}

      {reviewCount !== undefined && (
        <span
          style={{
            fontFamily: "var(--font-montserrat)",
            fontSize: size <= 14 ? "var(--text-xs)" : "var(--text-sm)",
            color: "var(--white-faint)",
          }}
        >
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
