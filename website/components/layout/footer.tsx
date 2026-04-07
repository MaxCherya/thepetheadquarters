"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

interface FooterProps {
  dict: {
    shop: string;
    company: string;
    legal: string;
    about: string;
    contact: string;
    privacy: string;
    terms: string;
    cookies: string;
    copyright: string;
    tagline: string;
  };
  navDict: {
    products: string;
    categories: string;
    brands: string;
  };
}

export function Footer({ dict, navDict }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const columns = [
    {
      title: dict.shop,
      links: [
        { label: navDict.products, href: "/products" },
        { label: navDict.categories, href: "/categories" },
        { label: navDict.brands, href: "/brands" },
      ],
    },
    {
      title: dict.company,
      links: [
        { label: dict.about, href: "/about" },
        { label: dict.contact, href: "/contact" },
      ],
    },
    {
      title: dict.legal,
      links: [
        { label: dict.privacy, href: "/legal/privacy" },
        { label: dict.terms, href: "/legal/terms" },
        { label: dict.cookies, href: "/legal/cookies" },
      ],
    },
  ];

  return (
    <footer style={{ background: "var(--bg-secondary)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div style={{ height: 1, background: "var(--bg-border)" }} />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
        {/* Brand + tagline */}
        <div className="mb-16 flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between" data-animate="fade-up">
          <div>
            <Link href="/" className="mb-4 flex items-center gap-3">
              <Image
                src="/img/logo.png"
                alt="The Pet Headquarters"
                width={48}
                height={48}
                className="rounded-full"
              />
              <span
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "var(--text-2xl)",
                  fontWeight: "var(--weight-light)",
                  color: "var(--gold)",
                  letterSpacing: "var(--tracking-wide)",
                }}
              >
                The Pet Headquarters
              </span>
            </Link>
            <p
              className="mt-4 max-w-sm"
              style={{
                fontFamily: "var(--font-montserrat)",
                fontSize: "var(--text-sm)",
                color: "var(--white-faint)",
                lineHeight: "var(--leading-relaxed)",
              }}
            >
              {dict.tagline}
            </p>
          </div>

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group flex items-center gap-2 transition-all duration-300 hover:text-[var(--gold)]"
            style={{
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-xs)",
              color: "var(--white-faint)",
              letterSpacing: "var(--tracking-wider)",
              textTransform: "uppercase",
            }}
          >
            Back to top
            <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Columns */}
        <div className="grid gap-10 sm:grid-cols-3" data-animate="stagger">
          {columns.map((col) => (
            <div key={col.title}>
              <h4
                className="mb-5"
                style={{
                  fontFamily: "var(--font-montserrat)",
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--weight-semibold)",
                  color: "var(--gold)",
                  letterSpacing: "var(--tracking-widest)",
                  textTransform: "uppercase",
                }}
              >
                {col.title}
              </h4>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1.5 transition-colors duration-200 hover:text-[var(--gold)]"
                      style={{
                        fontFamily: "var(--font-montserrat)",
                        fontSize: "var(--text-sm)",
                        color: "var(--white-faint)",
                      }}
                    >
                      {link.label}
                      <ArrowUpRight
                        size={12}
                        className="opacity-0 transition-all duration-200 group-hover:opacity-100"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div
          className="mt-16 flex flex-col items-center justify-between gap-4 pt-8 sm:flex-row"
          style={{ borderTop: "1px solid var(--bg-border)" }}
        >
          <span
            style={{
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-xs)",
              color: "var(--white-faint)",
            }}
          >
            &copy; {currentYear} The Pet Headquarters. {dict.copyright}
          </span>
          <div style={{ width: 40, height: 1, background: "var(--gold)" }} />
        </div>
      </div>
    </footer>
  );
}
