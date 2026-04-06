export const defaultLocale = "en" as const;

export const locales = ["en"] as const;

export type Locale = (typeof locales)[number];

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export function getLocalizedUrl(pathname: string, locale: Locale): string {
  if (locale === defaultLocale) return `${siteUrl}${pathname}`;
  return `${siteUrl}/${locale}${pathname}`;
}
