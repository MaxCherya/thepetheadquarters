"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { CartItem } from "@/types/cart";

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** Persisted promo code the customer has typed/applied. Empty string if none. */
  promotionCode: string;
  setPromotionCode: (code: string) => void;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "tph-cart";
const PROMO_KEY = "tph-cart-promo";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or unavailable
  }
}

function loadPromo(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(PROMO_KEY) || "";
  } catch {
    return "";
  }
}

function savePromo(code: string) {
  try {
    if (code) localStorage.setItem(PROMO_KEY, code);
    else localStorage.removeItem(PROMO_KEY);
  } catch {
    // ignore
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [promotionCode, setPromotionCodeState] = useState("");

  useEffect(() => {
    setItems(loadCart());
    setPromotionCodeState(loadPromo());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveCart(items);
  }, [items, loaded]);

  // Auto-apply ?promo=CODE from the URL on first mount + fire-and-forget click tracking.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const queryCode = params.get("promo");
    if (queryCode) {
      const upper = queryCode.trim().toUpperCase();
      setPromotionCodeState(upper);
      savePromo(upper);

      // Fire-and-forget click tracking — never block the page on this.
      // Use the API base from the same env var the rest of the app uses.
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      void fetch(`${apiBase}/promotions/track-click/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: upper }),
        keepalive: true,
      }).catch(() => {});
    }
  }, []);

  const addItem = useCallback((newItem: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === newItem.variantId);
      if (existing) {
        return prev.map((i) =>
          i.variantId === newItem.variantId
            ? { ...i, quantity: i.quantity + (newItem.quantity || 1) }
            : i,
        );
      }
      return [...prev, { ...newItem, quantity: newItem.quantity || 1 }];
    });
    setDrawerOpen(true);
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.variantId !== variantId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setPromotionCodeState("");
    savePromo("");
  }, []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const setPromotionCode = useCallback((code: string) => {
    const next = (code || "").trim().toUpperCase();
    setPromotionCodeState(next);
    savePromo(next);
  }, []);

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);

  const value = useMemo(
    () => ({
      items, addItem, removeItem, updateQuantity, clearCart,
      totalItems, subtotal, drawerOpen, openDrawer, closeDrawer,
      promotionCode, setPromotionCode,
    }),
    [items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal, drawerOpen, openDrawer, closeDrawer, promotionCode, setPromotionCode],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
