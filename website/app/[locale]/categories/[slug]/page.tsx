import { notFound } from "next/navigation";
import type { Metadata } from "next";

import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCategoryBySlug } from "@/hooks/categories.server";
import { getBrands } from "@/hooks/brands.server";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

import { CategoryProductsView } from "./_components/category-products-view";

interface PageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const category = await getCategoryBySlug(slug, locale);
    return {
      title: category.name,
      description: `Browse ${category.name} products at The Pet Headquarters.`,
    };
  } catch {
    return { title: "Category Not Found" };
  }
}

export default async function CategoryDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;

  let category;
  try {
    category = await getCategoryBySlug(slug, locale);
  } catch {
    notFound();
  }

  const dict = await getDictionary(locale, "products");
  const brands = await getBrands(locale).catch(() => []);

  return (
    <main className="py-16 md:py-24" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Categories", href: "/categories" },
            { label: category.name },
          ]}
        />

        <div className="mb-8 md:mb-12" data-animate="fade-up">
          <h1
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: "var(--weight-light)",
              color: "var(--white)",
              letterSpacing: "var(--tracking-tight)",
            }}
          >
            {category.name}
          </h1>
          <div
            className="mt-4"
            data-animate="divider"
            style={{ width: 60, height: 1, background: "var(--gold)" }}
          />
        </div>

        {/* Subcategories */}
        {category.children && category.children.length > 0 && (
          <div className="mb-10 flex flex-wrap gap-2" data-animate="stagger">
            {category.children.map((child) => (
              <a
                key={child.id}
                href={`/categories/${child.slug}`}
                className="rounded-full px-4 py-2 transition-all duration-200 hover:bg-[var(--gold)] hover:text-[var(--black)]"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--bg-border)",
                  color: "var(--white-dim)",
                  fontFamily: "var(--font-montserrat)",
                  fontSize: "var(--text-sm)",
                }}
              >
                {child.name}
              </a>
            ))}
          </div>
        )}

        <CategoryProductsView
          categoryId={category.id}
          dict={dict}
          brands={brands}
          lang={locale}
        />
      </div>
    </main>
  );
}
