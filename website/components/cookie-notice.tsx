"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import { setAnalyticsOptOut } from "@/lib/analytics";

const STORAGE_KEY = "tph-cookie-notice-dismissed";

/**
 * Lightweight transparency notice — not a hard consent gate.
 *
 * Our setup uses only:
 *   - Strictly necessary cookies (login session, cart)
 *   - First-party cookieless anonymized analytics
 *
 * Neither of these requires consent under PECR / UK GDPR. We show this
 * notice anyway for transparency and to give users a one-click opt-out
 * from analytics if they prefer.
 *
 * Hidden after the user dismisses it (stored in localStorage).
 */
export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        // Defer the appearance slightly so it doesn't compete with the
        // first paint of the page.
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage unavailable — show the notice once per page load
      setVisible(true);
    }
  }, []);

  function dismiss(optOut: boolean) {
    try {
      localStorage.setItem(STORAGE_KEY, optOut ? "opted-out" : "accepted");
    } catch {
      // ignore
    }
    setAnalyticsOptOut(optOut);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookies and privacy notice"
      className="fixed bottom-0 left-0 right-0 z-50 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-md"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--gold)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
        padding: "var(--space-5)",
        margin: "var(--space-3)",
        // On mobile use sticky bottom with no margin so it spans full width
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cookie size={16} style={{ color: "var(--gold)" }} />
          <h2
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "var(--text-lg)",
              color: "var(--white)",
              lineHeight: 1.2,
            }}
          >
            Privacy &amp; cookies
          </h2>
        </div>
        <button
          type="button"
          onClick={() => dismiss(false)}
          aria-label="Dismiss"
          className="shrink-0 rounded-md p-1 transition-colors hover:bg-[rgba(187,148,41,0.08)]"
          style={{ color: "var(--white-faint)" }}
        >
          <X size={16} />
        </button>
      </div>

      <p
        className="mb-4"
        style={{
          fontFamily: "var(--font-montserrat)",
          fontSize: "var(--text-xs)",
          color: "var(--white-dim)",
          lineHeight: "var(--leading-relaxed)",
        }}
      >
        We use a small login cookie so you can sign in and check out. We also
        run our own privacy-friendly anonymous analytics so we can improve the
        site — no third parties, no tracking across other websites, no advert
        cookies.{" "}
        <Link
          href="/legal/cookies"
          style={{ color: "var(--gold-dark)", textDecoration: "underline" }}
        >
          Learn more
        </Link>
        .
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => dismiss(false)}
          className="btn-gold flex-1 rounded-md py-2.5"
          style={{
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--weight-semibold)",
            textTransform: "uppercase",
            letterSpacing: "var(--tracking-wide)",
          }}
        >
          OK, got it
        </button>
        <button
          type="button"
          onClick={() => dismiss(true)}
          className="flex-1 rounded-md py-2.5 transition-colors hover:bg-[rgba(187,148,41,0.05)]"
          style={{
            border: "1px solid var(--bg-border)",
            color: "var(--white-dim)",
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--weight-medium)",
            textTransform: "uppercase",
            letterSpacing: "var(--tracking-wide)",
          }}
        >
          Reject analytics
        </button>
      </div>
    </div>
  );
}
