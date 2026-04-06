import type { MetadataRoute } from "next";

import { locales, defaultLocale, siteUrl } from "@/i18n/config";

function buildAlternates(pathname: string) {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] =
      locale === defaultLocale
        ? `${siteUrl}${pathname}`
        : `${siteUrl}/${locale}${pathname}`;
  }
  languages["x-default"] = `${siteUrl}${pathname}`;
  return { languages };
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
      alternates: buildAlternates("/"),
    },
  ];
}
