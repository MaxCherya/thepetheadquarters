"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageview } from "@/lib/analytics";

/**
 * Fires a pageview event whenever the URL changes (initial load + every
 * client-side navigation). Lives once at the root of the app, just inside
 * the existing providers, so it tracks every route except admin (which
 * the analytics lib filters out).
 *
 * Uses an idle callback for the initial pageview so it never competes
 * with critical rendering on first load.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    const url = `${pathname}?${searchParams?.toString() || ""}`;
    if (previous.current === url) return;
    previous.current = url;

    // Defer to idle so we don't compete with hydration / critical paint
    const ric =
      (typeof window !== "undefined" &&
        (window as Window & { requestIdleCallback?: (cb: () => void) => number })
          .requestIdleCallback) ||
      ((cb: () => void) => setTimeout(cb, 0));
    ric(() => trackPageview());
  }, [pathname, searchParams]);

  return null;
}
