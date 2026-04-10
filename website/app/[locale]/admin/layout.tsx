import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { isValidLocale } from "@/i18n/config";
import { notFound } from "next/navigation";
import { AdminProtectedRoute } from "./_components/admin-protected-route";
import { AdminSidebar } from "./_components/admin-sidebar";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale, "admin");

  return (
    <AdminProtectedRoute>
      <section className="py-8 md:py-12" style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-[240px_1fr]">
          <AdminSidebar dict={dict} />
          <main>{children}</main>
        </div>
      </section>
    </AdminProtectedRoute>
  );
}
