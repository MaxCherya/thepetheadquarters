import type { Metadata } from "next";
import { Mail, Clock, MessageCircle } from "lucide-react";

import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

import { ContactForm } from "./_components/contact-form";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with The Pet Headquarters. We're here to help.",
};

export default async function ContactPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale, "contact");

  return (
    <main className="py-16 md:py-24" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: dict.title }]} />

        <div className="mb-12 text-center md:mb-16" data-animate="fade-up">
          <h1
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: "var(--weight-light)",
              color: "var(--white)",
            }}
          >
            {dict.title}
          </h1>
          <div className="mx-auto mt-4" style={{ width: 60, height: 1, background: "var(--gold)" }} data-animate="divider" />
          <p
            className="mx-auto mt-6 max-w-xl"
            style={{
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-base)",
              color: "var(--white-dim)",
              lineHeight: "var(--leading-relaxed)",
            }}
          >
            {dict.subtitle}
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-5">
          {/* Form */}
          <div className="md:col-span-3" data-animate="fade-up">
            <ContactForm dict={dict.form} />
          </div>

          {/* Info */}
          <div className="flex flex-col gap-6 md:col-span-2" data-animate="fade-up">
            <h2
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "var(--text-2xl)",
                fontWeight: "var(--weight-medium)",
                color: "var(--white)",
              }}
            >
              {dict.info.title}
            </h2>

            {[
              { icon: Mail, label: dict.info.email },
              { icon: Clock, label: dict.info.hours },
              { icon: MessageCircle, label: dict.info.response },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "rgba(187,148,41,0.1)", border: "1px solid rgba(187,148,41,0.2)" }}
                >
                  <item.icon size={16} style={{ color: "var(--gold)" }} />
                </div>
                <span
                  className="pt-2"
                  style={{
                    fontFamily: "var(--font-montserrat)",
                    fontSize: "var(--text-sm)",
                    color: "var(--white-dim)",
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
