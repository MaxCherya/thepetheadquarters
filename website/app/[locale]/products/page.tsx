import type { Metadata } from "next";

import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getRootCategories } from "@/hooks/categories.server";
import { getBrands } from "@/hooks/brands.server";

import { ProductsView } from "./_components/products-view";

export const metadata: Metadata = {
  title: "Shop All Products",
  description:
    "Browse our full range of premium pet products. Filter by category, brand, and price.",
};

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ search?: string }>;
}) {
  const { locale } = await params;
  const { search: initialSearch } = await searchParams;
  const dict = await getDictionary(locale, "products");

  const [categories, brands] = await Promise.allSettled([
    getRootCategories(locale),
    getBrands(locale),
  ]);

  return (
    <main className="py-16 md:py-24" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
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
            {dict.title}
          </h1>
          <div
            className="mt-4"
            data-animate="divider"
            style={{ width: 60, height: 1, background: "var(--gold)" }}
          />
        </div>

        <ProductsView
          dict={dict}
          categories={categories.status === "fulfilled" ? categories.value : []}
          brands={brands.status === "fulfilled" ? brands.value : []}
          lang={locale}
          initialSearch={initialSearch || ""}
        />
      </div>
    </main>
  );
}
