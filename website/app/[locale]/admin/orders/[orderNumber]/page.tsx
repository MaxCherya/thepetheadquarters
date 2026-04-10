import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { isValidLocale } from "@/i18n/config";
import { notFound } from "next/navigation";
import { OrderDetailView } from "./_components/order-detail-view";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; orderNumber: string }>;
}) {
  const { locale, orderNumber } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale, "admin");

  return <OrderDetailView dict={dict} orderNumber={orderNumber} />;
}
