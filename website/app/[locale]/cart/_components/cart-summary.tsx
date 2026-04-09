"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

interface CartSummaryProps {
  dict: {
    title: string;
    subtotal: string;
    delivery: string;
    deliveryNote: string;
    total: string;
    checkout: string;
    continueShopping: string;
  };
}

function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function CartSummary({ dict }: CartSummaryProps) {
  const { subtotal, totalItems } = useCart();

  return (
    <div
      className="rounded-lg p-6"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}
    >
      <h2
        className="mb-6"
        style={{
          fontFamily: "var(--font-cormorant)",
          fontSize: "var(--text-2xl)",
          fontWeight: "var(--weight-medium)",
          color: "var(--white)",
        }}
      >
        {dict.title}
      </h2>

      <div className="flex flex-col gap-3">
        <div className="flex justify-between">
          <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)" }}>
            {dict.subtotal} ({totalItems} items)
          </span>
          <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--white)" }}>
            {formatPrice(subtotal)}
          </span>
        </div>

        <div className="flex justify-between">
          <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-dim)" }}>
            {dict.delivery}
          </span>
          <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
            {dict.deliveryNote}
          </span>
        </div>

        <div style={{ height: 1, background: "var(--bg-border)", margin: "var(--space-2) 0" }} />

        <div className="flex justify-between">
          <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-base)", fontWeight: 600, color: "var(--white)" }}>
            {dict.total}
          </span>
          <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--gold)" }}>
            {formatPrice(subtotal)}
          </span>
        </div>
      </div>

      <button
        disabled
        className="btn-gold mt-6 w-full rounded-md py-3 transition-all duration-300 disabled:opacity-50"
        style={{
          fontFamily: "var(--font-montserrat)",
          fontWeight: "var(--weight-semibold)",
          fontSize: "var(--text-sm)",
          letterSpacing: "var(--tracking-wider)",
          textTransform: "uppercase",
        }}
      >
        {dict.checkout}
      </button>

      <Link
        href="/products"
        className="mt-3 block text-center transition-colors duration-200 hover:text-[var(--gold)]"
        style={{
          fontFamily: "var(--font-montserrat)",
          fontSize: "var(--text-sm)",
          color: "var(--white-faint)",
        }}
      >
        {dict.continueShopping}
      </Link>
    </div>
  );
}
