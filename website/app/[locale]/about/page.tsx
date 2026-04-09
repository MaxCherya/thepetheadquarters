import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Shield, Leaf, Users } from "lucide-react";

import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about The Pet Headquarters — our story, values, and commitment to premium pet products.",
};

const valueIcons = [Shield, Heart, Leaf, Users];

export default async function AboutPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale, "about");

  return (
    <main style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 md:py-24">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: dict.title }]} />

        {/* Hero */}
        <div className="mb-16 text-center md:mb-20" data-animate="fade-up">
          <h1
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(2rem, 6vw, 3.5rem)",
              fontWeight: "var(--weight-light)",
              color: "var(--white)",
              lineHeight: "var(--leading-tight)",
            }}
          >
            {dict.hero.heading}
          </h1>
          <div className="mx-auto mt-6" style={{ width: 60, height: 1, background: "var(--gold)" }} data-animate="divider" />
          <p
            className="mx-auto mt-8 max-w-2xl"
            style={{
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-base)",
              color: "var(--white-dim)",
              lineHeight: "var(--leading-relaxed)",
            }}
          >
            {dict.hero.description}
          </p>
        </div>

        {/* Values */}
        <div className="mb-16 md:mb-20">
          <h2
            className="mb-10 text-center"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "var(--text-3xl)",
              fontWeight: "var(--weight-light)",
              color: "var(--white)",
            }}
            data-animate="fade-up"
          >
            {dict.values.title}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2" data-animate="stagger">
            {dict.values.items.map((item, i) => {
              const Icon = valueIcons[i];
              return (
                <div
                  key={item.title}
                  className="rounded-lg p-6"
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}
                >
                  <div
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ background: "rgba(187,148,41,0.1)", border: "1px solid rgba(187,148,41,0.2)" }}
                  >
                    <Icon size={20} style={{ color: "var(--gold)" }} />
                  </div>
                  <h3
                    className="mb-2"
                    style={{
                      fontFamily: "var(--font-cormorant)",
                      fontSize: "var(--text-xl)",
                      fontWeight: "var(--weight-medium)",
                      color: "var(--white)",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-montserrat)",
                      fontSize: "var(--text-sm)",
                      color: "var(--white-dim)",
                      lineHeight: "var(--leading-relaxed)",
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Story */}
        <div className="mb-16 md:mb-20" data-animate="fade-up">
          <h2
            className="mb-8"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "var(--text-3xl)",
              fontWeight: "var(--weight-light)",
              color: "var(--white)",
            }}
          >
            {dict.story.title}
          </h2>
          <div className="flex flex-col gap-4">
            {dict.story.paragraphs.map((p, i) => (
              <p
                key={i}
                style={{
                  fontFamily: "var(--font-montserrat)",
                  fontSize: "var(--text-base)",
                  color: "var(--white-dim)",
                  lineHeight: "var(--leading-relaxed)",
                }}
              >
                {p}
              </p>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          className="rounded-lg p-8 text-center sm:p-12"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}
          data-animate="scale"
        >
          <h2
            className="mb-3"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "var(--text-2xl)",
              fontWeight: "var(--weight-light)",
              color: "var(--white)",
            }}
          >
            {dict.cta.title}
          </h2>
          <p
            className="mb-6"
            style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)" }}
          >
            {dict.cta.description}
          </p>
          <Link
            href="/products"
            className="btn-gold inline-block transition-all duration-300 hover:-translate-y-0.5"
            style={{
              fontFamily: "var(--font-montserrat)",
              fontWeight: "var(--weight-semibold)",
              fontSize: "var(--text-sm)",
              letterSpacing: "var(--tracking-wider)",
              textTransform: "uppercase",
              padding: "var(--space-3) var(--space-8)",
              borderRadius: "var(--radius-md)",
            }}
          >
            {dict.cta.button}
          </Link>
        </div>
      </div>
    </main>
  );
}
