import type { MetadataRoute } from "next";

import { siteUrl } from "@/i18n/config";

/**
 * robots.txt generation.
 *
 * We allow crawling of all public catalog and content pages, but explicitly
 * disallow:
 *  - /api/*           (the JSON API — never useful in search)
 *  - /admin           (merchant admin — protected anyway, but doubly hidden)
 *  - /account*        (customer account, login, register, password reset)
 *  - /checkout*       (checkout flow, success page — sensitive + duplicate)
 *  - /cart            (per-user state, no SEO value)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/admin/",
          "/account",
          "/account/",
          "/checkout",
          "/checkout/",
          "/cart",
          "/*?promo=",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
