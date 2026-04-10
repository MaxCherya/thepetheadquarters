import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { isValidLocale } from "@/i18n/config";
import { notFound } from "next/navigation";
import { CheckoutContent } from "./_components/checkout-content";

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale, "checkout");

  return (
    <section className="py-12 md:py-16" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h1
          className="mb-8 text-center md:mb-12"
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "var(--text-4xl)",
            fontWeight: "var(--weight-regular)",
            color: "var(--white)",
          }}
        >
          {dict.title}
        </h1>
        <CheckoutContent dict={dict} />
      </div>
    </section>
  );
}
