"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ChevronRight } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import type { OrderListItem } from "@/types/order";
import type { PaginatedResponse } from "@/types/api";

function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
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

export function OrderHistory() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<PaginatedResponse<OrderListItem>>(endpoints.orders.list)
      .then((res) => {
        setOrders(res.results || []);
      })
      .catch(() => {
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full" style={{ border: "2px solid var(--bg-border)", borderTopColor: "var(--gold)" }} />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-lg py-16 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--bg-border)" }}>
        <Package size={40} className="mx-auto mb-4" style={{ color: "var(--white-faint)" }} />
        <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--white-faint)" }}>
          You haven&apos;t placed any orders yet.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-block transition-colors duration-200 hover:text-[var(--gold)]"
          style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)", color: "var(--gold-dark)", fontWeight: "var(--weight-medium)" }}
        >
          Start shopping →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => {
        const colors = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
        return (
          <Link
            key={order.id}
            href={`/account/orders/${order.order_number}`}
            className="card-hover group flex items-center justify-between rounded-lg transition-all duration-200"
            style={{ background: "var(--bg-secondary)", padding: "var(--space-5)" }}
          >
            <div className="flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-base)", fontWeight: "var(--weight-semibold)", color: "var(--white)" }}>
                  {order.order_number}
                </span>
                <span
                  className="rounded-full px-2.5 py-0.5"
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
              <p style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
                {formatDate(order.created_at)} · {order.item_count} {order.item_count === 1 ? "item" : "items"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-base)", fontWeight: "var(--weight-bold)", color: "var(--gold-dark)" }}>
                {formatPrice(order.total)}
              </span>
              <ChevronRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" style={{ color: "var(--white-faint)" }} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
