import type { ProductAttribute } from "@/hooks/attributes.server";

interface ProductSpecsProps {
  attributes: ProductAttribute[];
  title: string;
}

export function ProductSpecs({ attributes, title }: ProductSpecsProps) {
  if (attributes.length === 0) return null;

  return (
    <div>
      <h3
        className="mb-4"
        style={{
          fontFamily: "var(--font-cormorant)",
          fontSize: "var(--text-2xl)",
          fontWeight: "var(--weight-medium)",
          color: "var(--white)",
        }}
      >
        {title}
      </h3>
      <div
        className="overflow-hidden rounded-lg"
        style={{ border: "1px solid var(--bg-border)" }}
      >
        {attributes.map((attr, i) => (
          <div
            key={attr.attribute_key}
            className="flex"
            style={{
              borderBottom:
                i < attributes.length - 1
                  ? "1px solid var(--bg-border)"
                  : "none",
            }}
          >
            <div
              className="w-40 shrink-0 px-4 py-3 sm:w-52"
              style={{
                background: "var(--bg-secondary)",
                fontFamily: "var(--font-montserrat)",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--weight-medium)",
                color: "var(--white-dim)",
              }}
            >
              {attr.attribute_name}
            </div>
            <div
              className="flex-1 px-4 py-3"
              style={{
                background: "var(--bg-tertiary)",
                fontFamily: "var(--font-montserrat)",
                fontSize: "var(--text-sm)",
                color: "var(--white)",
              }}
            >
              {attr.display_value}
              {attr.attribute_key === "weight" && " g"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
