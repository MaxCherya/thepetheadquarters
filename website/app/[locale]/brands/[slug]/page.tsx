import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";

import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getBrandBySlug } from "@/hooks/brands.server";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

import { BrandProductsView } from "./_components/brand-products-view";

interface PageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const brand = await getBrandBySlug(slug, locale);
    return {
      title: brand.name,
      description: `Shop ${brand.name} products at The Pet Headquarters.`,
    };
  } catch {
    return { title: "Brand Not Found" };
  }
}

export default async function BrandDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;

  let brand;
  try {
    brand = await getBrandBySlug(slug, locale);
  } catch {
    notFound();
  }

  const dict = await getDictionary(locale, "products");

  return (
    <main className="py-16 md:py-24" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Brands", href: "/brands" },
            { label: brand.name },
          ]}
        />

        {/* Brand header */}
        <div className="mb-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center md:mb-14" data-animate="fade-up">
          {brand.logo && (
            <div
              className="flex h-20 w-20 items-center justify-center rounded-xl sm:h-24 sm:w-24"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}
            >
              <Image
                src={brand.logo}
                alt={brand.name}
                width={200}
                height={80}
                className="h-10 w-auto object-contain sm:h-14"
                style={{ filter: "brightness(0)" }}
              />
            </div>
          )}
          <div>
            <h1
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "clamp(2rem, 5vw, 3rem)",
                fontWeight: "var(--weight-regular)",
                color: "var(--white)",
                letterSpacing: "var(--tracking-tight)",
              }}
            >
              {brand.name}
            </h1>
            {brand.description && (
              <p
                className="mt-2 max-w-2xl"
                style={{
                  fontFamily: "var(--font-montserrat)",
                  fontSize: "var(--text-sm)",
                  color: "var(--white-dim)",
                  lineHeight: "var(--leading-relaxed)",
                }}
              >
                {brand.description}
              </p>
            )}
            <div
              className="mt-4"
              data-animate="divider"
              style={{ width: 60, height: 1, background: "var(--gold)" }}
            />
          </div>
        </div>

        <BrandProductsView brandId={brand.id} dict={dict} lang={locale} />
      </div>
    </main>
  );
}
