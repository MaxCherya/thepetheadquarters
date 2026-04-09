import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import type { Locale } from "@/i18n/config";
import { getBrands } from "@/hooks/brands.server";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata: Metadata = {
  title: "Our Brands",
  description: "Explore the premium pet brands we carry at The Pet Headquarters.",
};

export default async function BrandsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const brands = await getBrands(locale).catch(() => []);

  return (
    <main className="py-16 md:py-24" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Brands" }]} />

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
            Our Brands
          </h1>
          <div
            className="mt-4"
            data-animate="divider"
            style={{ width: 60, height: 1, background: "var(--gold)" }}
          />
        </div>

        {brands.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4" data-animate="stagger">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/brands/${brand.slug}`}
                className="card-hover group flex flex-col items-center justify-center gap-4 overflow-hidden rounded-lg p-8"
                style={{ background: "var(--bg-secondary)", minHeight: 180 }}
              >
                {brand.logo ? (
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    width={200}
                    height={80}
                    className="h-12 w-auto object-contain transition-all duration-300 group-hover:scale-105 sm:h-16"
                    style={{ filter: "brightness(0)" }}
                    loading="lazy"
                  />
                ) : (
                  <span
                    style={{
                      fontFamily: "var(--font-cormorant)",
                      fontSize: "var(--text-3xl)",
                      color: "var(--gold)",
                      opacity: 0.3,
                    }}
                  >
                    {brand.name[0]}
                  </span>
                )}
                <span
                  className="transition-colors duration-200 group-hover:text-[var(--gold)]"
                  style={{
                    fontFamily: "var(--font-montserrat)",
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--weight-medium)",
                    color: "var(--white-dim)",
                    letterSpacing: "var(--tracking-wider)",
                    textTransform: "uppercase",
                  }}
                >
                  {brand.name}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ fontFamily: "var(--font-montserrat)", color: "var(--white-faint)" }}>
            No brands found.
          </p>
        )}
      </div>
    </main>
  );
}
