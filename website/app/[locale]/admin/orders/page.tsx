import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { isValidLocale } from "@/i18n/config";
import { notFound } from "next/navigation";
import { OrdersView } from "./_components/orders-view";

export default async function AdminOrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale, "admin");

  return (
    <div>
      <h1
        style={{
          fontFamily: "var(--font-cormorant)",
          fontSize: "var(--text-3xl)",
          fontWeight: "var(--weight-regular)",
          color: "var(--white)",
          marginBottom: "var(--space-6)",
        }}
      >
        {dict.orders.title}
      </h1>
      <OrdersView dict={dict} />
    </div>
  );
}
