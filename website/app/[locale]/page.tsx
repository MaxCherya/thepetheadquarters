import type { Metadata } from "next";
import type { WithContext, Organization } from "schema-dts";

import type { Locale } from "@/i18n/config";
import { siteUrl } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { JsonLd } from "@/lib/json-ld";

export const metadata: Metadata = {
  title: "Premium Pet Products & Supplies",
  description:
    "Discover premium pet products at The Pet Headquarters. Quality food, accessories, and supplies for your beloved companions.",
};

const organizationJsonLd: WithContext<Organization> = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "The Pet Headquarters",
  url: siteUrl,
};

export default async function Home({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const common = await getDictionary(locale, "common");
  const home = await getDictionary(locale, "home");

  return (
    <main>
      <JsonLd data={organizationJsonLd} />
      <div>{common.siteName}</div>
      <div>{home.title}</div>
    </main>
  );
}
