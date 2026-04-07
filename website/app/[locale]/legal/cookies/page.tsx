import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { LegalPage } from "../_components/legal-page";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Cookie Policy for The Pet Headquarters. How we use cookies on our website.",
};

export default async function CookiesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale, "legal");
  return <LegalPage data={dict.cookies} backLabel="Home" backHref="/" />;
}
