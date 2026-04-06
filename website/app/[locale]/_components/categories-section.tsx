import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/types/category";

interface CategoriesSectionProps {
  dict: {
    label: string;
    title: string;
  };
  categories: Category[];
}

export function CategoriesSection({ dict, categories }: CategoriesSectionProps) {
  if (categories.length === 0) return null;

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
              color: "var(--gold)",
            }}
          >
            {dict.label}
          </span>
          <h2
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
              fontWeight: "var(--weight-light)",
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
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group block overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[var(--gold)] hover:shadow-[0_8px_30px_rgba(201,168,76,0.2)]"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--bg-border)",
                borderRadius: "var(--radius-lg)",
              }}
            >
              {category.image && (
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-3 text-center sm:p-4">
                <h3
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontSize: "clamp(0.875rem, 2vw, 1.25rem)",
                    fontWeight: "var(--weight-medium)",
                    color: "var(--white)",
                  }}
                >
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
