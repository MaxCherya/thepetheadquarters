import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { isValidLocale } from "@/i18n/config";
import { notFound } from "next/navigation";
import { SuccessContent } from "../_components/success-content";

export default async function CheckoutSuccessPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ session_id?: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale, "checkout");
  const { session_id } = await searchParams;

  return (
    <section className="flex min-h-[60vh] items-center justify-center py-16" style={{ background: "var(--bg-primary)" }}>
      <div className="w-full max-w-lg px-4 text-center sm:px-6">
        <SuccessContent dict={dict} sessionId={session_id || ""} />
      </div>
    </section>
  );
}
