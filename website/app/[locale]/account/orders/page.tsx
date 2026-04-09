import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { isValidLocale } from "@/i18n/config";
import { notFound } from "next/navigation";
import { Package } from "lucide-react";
import { ProtectedRoute } from "../_components/protected-route";
import { AccountSidebar } from "../_components/account-sidebar";

export default async function OrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale, "auth");

  return (
    <ProtectedRoute>
      <section className="py-12 md:py-16" style={{ background: "var(--bg-primary)" }}>
        <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 md:grid-cols-[240px_1fr]">
          <AccountSidebar dict={dict} />
          <div>
            <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)", marginBottom: "var(--space-8)" }}>
              {dict.account.orders}
            </h1>
            <div className="rounded-lg py-16 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
              <Package size={40} className="mx-auto mb-4" style={{ color: "var(--white-faint)" }} />
              <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>
                Order history coming soon.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ProtectedRoute>
  );
}
