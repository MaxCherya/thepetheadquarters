import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { isValidLocale } from "@/i18n/config";
import { notFound } from "next/navigation";
import { ProtectedRoute } from "../../_components/protected-route";
import { AccountSidebar } from "../../_components/account-sidebar";
import { OrderDetail } from "../../_components/order-detail";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; orderNumber: string }>;
}) {
  const { locale, orderNumber } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale, "auth");

  return (
    <ProtectedRoute>
      <section className="py-12 md:py-16" style={{ background: "var(--bg-primary)" }}>
        <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 md:grid-cols-[240px_1fr]">
          <AccountSidebar dict={dict} />
          <div>
            <OrderDetail orderNumber={orderNumber} />
          </div>
        </div>
      </section>
    </ProtectedRoute>
  );
}
