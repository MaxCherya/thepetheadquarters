/**
 * Slug-redirect resolver.
 *
 * Used by product/category/brand detail pages: when the API returns 404
 * for a slug, the page calls one of these helpers to ask the backend
 * whether the slug is a known historical alias for a renamed object.
 *
 * If the helper returns a string, the page should issue a permanent
 * (308) redirect to `/<base>/<new_slug>`. If it returns null, the page
 * should fall through to `notFound()`.
 *
 * The backend SlugHistory table is populated automatically by SlugMixin
 * whenever an admin renames a product/category/brand, so external links
 * never go stale.
 */

import { endpoints } from "@/config/endpoints";

interface RedirectResponse {
  status: string;
  data?: { slug: string };
  code?: string;
}

async function lookup(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      // Cache for an hour so 404 → redirect lookups don't hammer the API
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as RedirectResponse;
    return json?.data?.slug || null;
  } catch {
    return null;
  }
}

export function resolveProductRedirect(oldSlug: string): Promise<string | null> {
  return lookup(endpoints.seo.redirectProduct(oldSlug));
}

export function resolveCategoryRedirect(oldSlug: string): Promise<string | null> {
  return lookup(endpoints.seo.redirectCategory(oldSlug));
}

export function resolveBrandRedirect(oldSlug: string): Promise<string | null> {
  return lookup(endpoints.seo.redirectBrand(oldSlug));
}
