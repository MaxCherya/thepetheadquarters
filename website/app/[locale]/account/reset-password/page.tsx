import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { isValidLocale } from "@/i18n/config";
import { notFound } from "next/navigation";
import { ResetPasswordForm } from "../_components/reset-password-form";

export default async function ResetPasswordPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ token?: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale, "auth");
  const { token } = await searchParams;

  return (
    <section className="flex min-h-[70vh] items-center justify-center py-16" style={{ background: "var(--bg-primary)" }}>
      <div className="w-full max-w-md px-4 sm:px-6">
        <div className="text-center" style={{ marginBottom: "var(--space-8)" }}>
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-4xl)", fontWeight: "var(--weight-regular)", color: "var(--white)", letterSpacing: "var(--tracking-tight)", marginBottom: "var(--space-2)" }}>
            {dict.resetPassword.title}
          </h1>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)" }}>
            {dict.resetPassword.subtitle}
          </p>
        </div>
        <ResetPasswordForm dict={dict} token={token || ""} />
      </div>
    </section>
  );
}
