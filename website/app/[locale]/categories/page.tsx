import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import type { Locale } from "@/i18n/config";
import { getRootCategories } from "@/hooks/categories.server";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata: Metadata = {
  title: "Shop by Category",
  description: "Browse our pet product categories. Find everything your pet needs.",
};

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const categories = await getRootCategories(locale).catch(() => []);

  return (
    <main className="py-16 md:py-24" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Categories" }]} />

        <div className="mb-8 md:mb-12" data-animate="fade-up">
          <h1
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: "var(--weight-regular)",
              color: "var(--white)",
              letterSpacing: "var(--tracking-tight)",
            }}
          >
            Shop by Category
          </h1>
          <div
            className="mt-4"
            data-animate="divider"
            style={{ width: 60, height: 1, background: "var(--gold)" }}
          />
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4" data-animate="stagger">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="card-hover group block overflow-hidden rounded-lg"
                style={{ background: "var(--bg-secondary)" }}
              >
                {category.image ? (
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
                ) : (
                  <div
                    className="flex aspect-square items-center justify-center"
                    style={{ background: "var(--bg-tertiary)" }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontSize: "var(--text-4xl)",
                        color: "var(--gold)",
                        opacity: 0.3,
                      }}
                    >
                      {category.name[0]}
                    </span>
                  </div>
                )}
                <div className="p-4 text-center">
                  <h2
                    style={{
                      fontFamily: "var(--font-cormorant)",
                      fontSize: "var(--text-xl)",
                      fontWeight: "var(--weight-medium)",
                      color: "var(--white)",
                    }}
                  >
                    {category.name}
                  </h2>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ fontFamily: "var(--font-montserrat)", color: "var(--white-faint)" }}>
            No categories found.
          </p>
        )}
      </div>
    </main>
  );
}
