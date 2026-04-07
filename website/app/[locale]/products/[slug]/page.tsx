import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { WithContext, Product as ProductSchema } from "schema-dts";

import type { Locale } from "@/i18n/config";
import { siteUrl } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getProductBySlug } from "@/hooks/products.server";
import { getProducts } from "@/hooks/products.server";
import { getProductAttributes } from "@/hooks/attributes.server";
import { JsonLd } from "@/lib/json-ld";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

import { ImageGallery } from "./_components/image-gallery";
import { ProductInfo } from "./_components/product-info";
import { ProductTabs } from "./_components/product-tabs";
import { ShareButtons } from "./_components/share-buttons";
import { RelatedProducts } from "./_components/related-products";

interface PageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  try {
    const product = await getProductBySlug(slug, locale);
    return {
      title: product.meta_title || product.name,
      description: product.meta_description || product.short_description,
      openGraph: {
        title: product.name,
        description: product.short_description,
        images: product.primary_image ? [{ url: product.primary_image }] : [],
        type: "website",
      },
    };
  } catch {
    return { title: "Product Not Found" };
  }
}

function formatPrice(pence: number): string {
  return (pence / 100).toFixed(2);
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;

  let product;
  try {
    product = await getProductBySlug(slug, locale);
  } catch {
    notFound();
  }

  const dict = await getDictionary(locale, "product");

  // Fetch attributes and related products in parallel
  const [attributesResult, relatedResult] = await Promise.allSettled([
    getProductAttributes(product.id, locale),
    product.category_ids.length > 0
      ? getProducts({ category: product.category_ids[0], page_size: "5" }, locale)
      : Promise.resolve({ count: 0, next: null, previous: null, results: [] }),
  ]);

  const attributes = attributesResult.status === "fulfilled" ? attributesResult.value : [];
  const relatedRaw = relatedResult.status === "fulfilled" ? relatedResult.value.results : [];
  const relatedProducts = relatedRaw.filter((p) => p.id !== product.id).slice(0, 4);

  const minPrice = product.min_price;
  const maxPrice = product.max_price;

  const jsonLd: WithContext<ProductSchema> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_description,
    image: product.primary_image || undefined,
    url: `${siteUrl}/products/${slug}`,
    ...(minPrice !== null && {
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "GBP",
        lowPrice: formatPrice(minPrice),
        highPrice: maxPrice !== null ? formatPrice(maxPrice) : formatPrice(minPrice),
        availability: product.in_stock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      },
    }),
    ...(Number(product.average_rating) > 0 && {
      aggregateRating: {
        "@type": "AggregateRating" as const,
        ratingValue: String(product.average_rating),
        reviewCount: product.review_count,
      },
    }),
  };

  const breadcrumbs = [
    { label: dict.breadcrumb.home, href: "/" },
    { label: dict.breadcrumb.products, href: "/products" },
    { label: product.name },
  ];

  const productUrl = `${siteUrl}/products/${slug}`;

  return (
    <main className="py-8 md:py-16" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <JsonLd data={jsonLd} />
        <Breadcrumbs items={breadcrumbs} />

        {/* Product layout */}
        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          {/* Left — Images */}
          <div data-animate="fade-up">
            <ImageGallery images={product.images} productName={product.name} />
          </div>

          {/* Right — Info + Share */}
          <div data-animate="fade-up">
            <ProductInfo product={product} dict={dict.details} />
            <div className="mt-6 pt-6" style={{ borderTop: "1px solid var(--bg-border)" }}>
              <ShareButtons url={productUrl} title={product.name} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <ProductTabs
          description={product.description}
          attributes={attributes}
          dict={dict.details}
          reviewCount={product.review_count}
        />

        {/* Related Products */}
        <RelatedProducts
          products={relatedProducts}
          title="You Might Also Like"
        />
      </div>
    </main>
  );
}
