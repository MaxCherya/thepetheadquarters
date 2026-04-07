"use client";

import type { ProductVariant } from "@/types/product";

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  selectLabel: string;
}

function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function VariantSelector({ variants, selectedId, onSelect, selectLabel }: VariantSelectorProps) {
  if (variants.length <= 1) return null;

  return (
    <div className="flex flex-col gap-2">
      <span
        style={{
          fontFamily: "var(--font-montserrat)",
          fontSize: "var(--text-sm)",
          fontWeight: "var(--weight-medium)",
          color: "var(--white-dim)",
        }}
      >
        {selectLabel}
      </span>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const isSelected = variant.id === selectedId;
          const optionLabel = variant.option_values.map((ov) => ov.value).join(" / ") || variant.sku;

          return (
            <button
              key={variant.id}
              onClick={() => onSelect(variant.id)}
              disabled={!variant.in_stock}
              className="rounded-md px-4 py-2 transition-all duration-200 disabled:opacity-40"
              style={{
                background: isSelected ? "var(--gold)" : "var(--bg-tertiary)",
                color: isSelected ? "var(--black)" : "var(--white)",
                border: `1px solid ${isSelected ? "var(--gold)" : "var(--bg-border)"}`,
                fontFamily: "var(--font-montserrat)",
                fontSize: "var(--text-sm)",
              }}
            >
              <span>{optionLabel}</span>
              <span
                className="ml-2"
                style={{
                  fontSize: "var(--text-xs)",
                  opacity: 0.7,
                }}
              >
                {formatPrice(variant.price)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
