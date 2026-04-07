import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { LegalPage } from "../_components/legal-page";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and Conditions for The Pet Headquarters. Your rights under UK consumer law.",
};

export default async function TermsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale, "legal");
  return <LegalPage data={dict.terms} backLabel="Home" backHref="/" />;
}
