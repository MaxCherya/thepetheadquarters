"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import type { Order } from "@/types/order";

interface OrderDetailProps {
  orderNumber: string;
}

function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: "rgba(230,81,0,0.1)", color: "var(--warning)" },
  paid: { bg: "rgba(187,148,41,0.12)", color: "var(--gold-dark)" },
  processing: { bg: "rgba(187,148,41,0.12)", color: "var(--gold-dark)" },
  shipped: { bg: "rgba(21,101,192,0.1)", color: "var(--info)" },
  delivered: { bg: "rgba(46,125,50,0.1)", color: "var(--success)" },
  cancelled: { bg: "rgba(198,40,40,0.08)", color: "var(--error)" },
};

export function OrderDetail({ orderNumber }: OrderDetailProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<{ status: string; data: Order }>(endpoints.orders.detail(orderNumber))
      .then((res) => setOrder(res.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full" style={{ border: "2px solid var(--bg-border)", borderTopColor: "var(--gold)" }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-lg py-16 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
        <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>
          Order not found.
        </p>
        <Link
          href="/account/orders"
          className="mt-6 inline-block transition-colors duration-200 hover:text-[var(--gold)]"
          style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--gold-dark)", fontWeight: "var(--weight-medium)" }}
        >
          ← Back to orders
        </Link>
      </div>
    );
  }

  const colors = STATUS_COLORS[order.status] || STATUS_COLORS.pending;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/account/orders"
        className="inline-flex w-fit items-center gap-2 transition-colors duration-200 hover:text-[var(--gold)]"
        style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" }}
      >
        <ArrowLeft size={14} />
        Back to orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "var(--text-3xl)", fontWeight: "var(--weight-regular)", color: "var(--white)" }}>
            {order.order_number}
          </h1>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>
            Placed on {formatDate(order.created_at)}
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1"
          style={{
            background: colors.bg,
            color: colors.color,
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--weight-semibold)",
            textTransform: "uppercase",
            letterSpacing: "var(--tracking-wide)",
          }}
        >
          {order.status}
        </span>
      </div>

      {/* Items */}
      <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-6)" }}>
        <h2 className="mb-4" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-medium)", color: "var(--white-faint)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" }}>
          Items ({order.items.length})
        </h2>
        <div className="flex flex-col gap-4">
          {order.items.map((item, i) => (
            <div
              key={item.id}
              className="flex gap-4"
              style={{
                paddingBottom: i < order.items.length - 1 ? "var(--space-4)" : 0,
                borderBottom: i < order.items.length - 1 ? "1px solid var(--bg-border)" : "none",
              }}
            >
              {item.image_url && (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md" style={{ background: "var(--bg-tertiary)" }}>
                  <Image src={item.image_url} alt={item.product_name} fill sizes="64px" className="object-cover" />
                </div>
              )}
              <div className="flex-1">
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--white)" }}>
                  {item.product_name}
                </p>
                {item.variant_option_label && (
                  <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
                    {item.variant_option_label}
                  </p>
                )}
                <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
                  Qty: {item.quantity} × {formatPrice(item.unit_price)}
                </p>
              </div>
              <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--white)" }}>
                {formatPrice(item.line_total)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Shipping address */}
        <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-5)" }}>
          <h2 className="mb-3" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-medium)", color: "var(--white-faint)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" }}>
            Shipping Address
          </h2>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--white)" }}>
            {order.shipping_full_name}
          </p>
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)", lineHeight: "var(--leading-relaxed)" }}>
            {order.shipping_address_line_1}
            {order.shipping_address_line_2 && `, ${order.shipping_address_line_2}`}
            <br />
            {order.shipping_city}{order.shipping_county ? `, ${order.shipping_county}` : ""} {order.shipping_postcode}
          </p>
        </div>

        {/* Payment summary */}
        <div className="rounded-lg" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)", padding: "var(--space-5)" }}>
          <h2 className="mb-3" style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-medium)", color: "var(--white-faint)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" }}>
            Payment
          </h2>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>Subtotal</span>
              <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white)" }}>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>Shipping</span>
              <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: order.shipping_cost === 0 ? "var(--success)" : "var(--white)" }}>
                {order.shipping_cost === 0 ? "FREE" : formatPrice(order.shipping_cost)}
              </span>
            </div>
            <div className="flex justify-between" style={{ paddingTop: "var(--space-2)", borderTop: "1px solid var(--bg-border)" }}>
              <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--white)" }}>Total</span>
              <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-base)", fontWeight: "var(--weight-bold)", color: "var(--gold-dark)" }}>
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
