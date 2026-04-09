import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { isValidLocale } from "@/i18n/config";
import { notFound } from "next/navigation";
import { VerifyEmailContent } from "../_components/verify-email-content";

export default async function VerifyEmailPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ token?: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale, "auth");
  const { token } = await searchParams;

  return (
    <section className="flex min-h-[70vh] items-center justify-center py-16" style={{ background: "var(--bg-primary)" }}>
      <div className="w-full max-w-md px-4 text-center sm:px-6">
        <VerifyEmailContent dict={dict} token={token} />
      </div>
    </section>
  );
}
