import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { isValidLocale } from "@/i18n/config";
import { notFound } from "next/navigation";
import { ForgotPasswordForm } from "../_components/forgot-password-form";

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale, "auth");

  return (
    <section className="flex min-h-[70vh] items-center justify-center py-16" style={{ background: "var(--bg-primary)" }}>
      <div className="w-full max-w-md px-4 sm:px-6">
        <div className="text-center" style={{ marginBottom: "var(--space-8)" }}>
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-4xl)", fontWeight: "var(--weight-regular)", color: "var(--white)", letterSpacing: "var(--tracking-tight)", marginBottom: "var(--space-2)" }}>
            {dict.forgotPassword.title}
          </h1>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)" }}>
            {dict.forgotPassword.subtitle}
          </p>
        </div>
        <ForgotPasswordForm dict={dict} />
      </div>
    </section>
  );
}
