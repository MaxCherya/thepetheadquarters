import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";

import { isValidLocale, locales, siteUrl, defaultLocale } from "@/i18n/config";
import { Providers, ToastContainer } from "@/components/providers";
import { ScrollAnimations } from "@/components/scroll-animations";
import { PageLoader } from "@/components/page-loader";

import "../globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const languages: Record<string, string> = { "x-default": siteUrl };
  for (const loc of locales) {
    languages[loc] = loc === defaultLocale ? siteUrl : `${siteUrl}/${loc}`;
  }

  return {
    metadataBase: new URL(siteUrl),
    title: {
      template: "%s | The Pet Headquarters",
      default: "The Pet Headquarters",
    },
    description:
      "Premium pet products for your beloved companions. Quality supplies, food, and accessories.",
    openGraph: {
      type: "website",
      locale: locale,
      siteName: "The Pet Headquarters",
    },
    twitter: {
      card: "summary_large_image",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    alternates: {
      languages,
    },
  };
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <html lang={locale} className={`dark page-loading ${cormorant.variable} ${montserrat.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.className=document.documentElement.className.replace('page-loading','page-loading');`,
          }}
        />
      </head>
      <body>
          <PageLoader />
          <Providers>{children}</Providers>
          <ToastContainer />
          <ScrollAnimations />
        </body>
    </html>
  );
}
