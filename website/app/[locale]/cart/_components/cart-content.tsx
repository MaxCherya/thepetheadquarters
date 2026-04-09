"use client";

import { useCart } from "@/lib/cart-context";
import { CartItems } from "./cart-items";
import { CartSummary } from "./cart-summary";
import { EmptyCart } from "./empty-cart";

interface CartContentProps {
  dict: {
    empty: { title: string; description: string; cta: string };
    item: { remove: string; quantity: string };
    summary: {
      title: string;
      subtotal: string;
      delivery: string;
      deliveryNote: string;
      total: string;
      checkout: string;
      continueShopping: string;
    };
  };
}

export function CartContent({ dict }: CartContentProps) {
  const { items } = useCart();

  if (items.length === 0) {
    return <EmptyCart dict={dict.empty} />;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <CartItems dict={dict.item} />
      </div>
      <div>
        <div className="sticky top-24">
          <CartSummary dict={dict.summary} />
        </div>
      </div>
    </div>
  );
}
