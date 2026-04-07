import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { LegalPage } from "../_components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for The Pet Headquarters. How we handle your data under UK GDPR.",
};

export default async function PrivacyPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale, "legal");
  return <LegalPage data={dict.privacy} backLabel="Home" backHref="/" />;
}
