import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import type { Locale } from "@/i18n/config";
import { siteUrl } from "@/i18n/config";
import { getProducts } from "@/hooks/products.server";
import { ProductCard } from "@/app/[locale]/_components/product-card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

interface PageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const q = (sp.q || "").trim();

  // Empty searches don't deserve a unique URL — point Google at /products
  if (!q) {
    return {
      title: "Search",
      description: "Search the full range of pet products at The Pet Headquarters.",
      alternates: { canonical: `${siteUrl}/products` },
      robots: { index: false, follow: true },
    };
  }

  const url = `${siteUrl}/search?q=${encodeURIComponent(q)}`;
  const title = `Search results for "${q}"`;
  const description = `Browse pet products matching "${q}" at The Pet Headquarters. Free UK delivery on orders over £30.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "The Pet Headquarters",
    },
    // Search results pages can be useful for long-tail queries — index them
    // but tell Google not to follow query-string variations endlessly.
    robots: { index: true, follow: true },
  };
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const q = (sp.q || "").trim();

  const results =
    q.length > 0
      ? await getProducts({ search: q, page_size: "24" }, locale).catch(() => ({
          count: 0,
          next: null,
          previous: null,
          results: [],
        }))
      : { count: 0, next: null, previous: null, results: [] };

  return (
    <main className="py-16 md:py-24" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />

        <div className="mb-8 md:mb-12">
          <h1
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: "var(--weight-regular)",
              color: "var(--white)",
              letterSpacing: "var(--tracking-tight)",
            }}
          >
            {q ? `Search results for "${q}"` : "Search"}
          </h1>
          <div
            className="mt-4"
            style={{ width: 60, height: 1, background: "var(--gold)" }}
          />
          {q && (
            <p
              className="mt-4"
              style={{
                fontFamily: "var(--font-montserrat)",
                fontSize: "var(--text-sm)",
                color: "var(--white-faint)",
              }}
            >
              {results.count} {results.count === 1 ? "product" : "products"} found
            </p>
          )}
        </div>

        {/* Search form */}
        <form action="/search" method="get" className="mb-10">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: "var(--white-faint)" }}
            />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="What are you looking for?"
              autoFocus
              className="w-full outline-none"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--bg-border)",
                color: "var(--white)",
                fontFamily: "var(--font-montserrat)",
                fontSize: "var(--text-base)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-4) var(--space-4) var(--space-4) var(--space-12)",
              }}
            />
          </div>
        </form>

        {q && results.results.length === 0 ? (
          <div
            className="rounded-lg py-16 text-center"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--bg-border)",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-montserrat)",
                fontSize: "var(--text-base)",
                color: "var(--white-dim)",
              }}
            >
              No products found for &ldquo;{q}&rdquo;.
            </p>
            <p
              className="mt-2"
              style={{
                fontFamily: "var(--font-montserrat)",
                fontSize: "var(--text-sm)",
                color: "var(--white-faint)",
              }}
            >
              Try a different search, or{" "}
              <Link href="/products" style={{ color: "var(--gold-dark)" }}>
                browse all products
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {results.results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
