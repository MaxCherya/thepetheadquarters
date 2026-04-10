import type { Metadata } from "next";

import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

import { CartContent } from "./_components/cart-content";

// Per-customer state — never index
export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review your cart and proceed to checkout.",
  robots: { index: false, follow: false },
};

export default async function CartPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale, "cart");

  return (
    <main className="py-16 md:py-24" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: dict.title }]} />

        <div className="mb-8 md:mb-12">
          <h1
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: "var(--weight-regular)",
              color: "var(--white)",
              letterSpacing: "var(--tracking-tight)",
            }}
          >
            {dict.title}
          </h1>
          <div
            className="mt-4"
            style={{ width: 60, height: 1, background: "var(--gold)" }}
          />
        </div>

        <CartContent dict={dict} />
      </div>
    </main>
  );
}
