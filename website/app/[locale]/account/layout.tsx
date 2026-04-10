import type { Metadata } from "next";

/**
 * All /account/* pages are per-customer and should never be indexed.
 * Setting `robots` here propagates to every child route, so we don't
 * have to remember to add it to every individual page.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
