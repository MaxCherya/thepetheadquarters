import type { Metadata } from "next";
import type { WithContext, Organization } from "schema-dts";

import type { Locale } from "@/i18n/config";
import { siteUrl } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { JsonLd } from "@/lib/json-ld";
import { getRootCategories } from "@/hooks/categories.server";
import { getFeaturedProducts, getNewArrivals } from "@/hooks/products.server";
import { getBrands } from "@/hooks/brands.server";

import { HeroSection } from "./_components/hero-section";
import { CategoriesSection } from "./_components/categories-section";
import { FeaturedProductsSection } from "./_components/featured-products-section";
import { TrustSignalsSection } from "./_components/trust-signals-section";
import { BrandsSection } from "./_components/brands-section";
import { NewArrivalsSection } from "./_components/new-arrivals-section";
import { NewsletterSection } from "./_components/newsletter-section";

export const metadata: Metadata = {
  title: "Premium Pet Products & Supplies",
  description:
    "Discover premium pet products at The Pet Headquarters. Quality food, accessories, and supplies for your beloved companions.",
};

const organizationJsonLd: WithContext<Organization> = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "The Pet Headquarters",
  url: siteUrl,
};

export default async function Home({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const home = await getDictionary(locale, "home");

  const [categories, featuredProducts, newArrivals, brands] = await Promise.allSettled([
    getRootCategories(locale),
    getFeaturedProducts(locale),
    getNewArrivals(locale),
    getBrands(locale),
  ]);

  return (
    <main>
      <JsonLd data={organizationJsonLd} />
      <HeroSection dict={home.hero} />
      <CategoriesSection
        dict={home.categories}
        categories={categories.status === "fulfilled" ? categories.value : []}
      />
      <FeaturedProductsSection
        dict={home.featured}
        products={featuredProducts.status === "fulfilled" ? featuredProducts.value : []}
      />
      <TrustSignalsSection dict={home.trust} />
      <BrandsSection
        dict={home.brands}
        brands={brands.status === "fulfilled" ? brands.value : []}
      />
      <NewArrivalsSection
        dict={home.newArrivals}
        products={newArrivals.status === "fulfilled" ? newArrivals.value : []}
      />
      <NewsletterSection dict={home.newsletter} />
    </main>
  );
}
