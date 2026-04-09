"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingCart, Menu, X, ArrowRight } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { CartPopup } from "./cart-popup";

interface HeaderProps {
  dict: {
    home: string;
    products: string;
    categories: string;
    brands: string;
    about: string;
    contact: string;
    search: string;
    cart: string;
  };
}

const navLinks = [
  { key: "products", href: "/products" },
  { key: "categories", href: "/categories" },
  { key: "brands", href: "/brands" },
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
] as const;

export function Header({ dict }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { totalItems, drawerOpen } = useCart();
  const cartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-open popup when item is added via context
  useEffect(() => {
    if (drawerOpen) setCartOpen(true);
  }, [drawerOpen]);

  // Close popup on click outside
  useEffect(() => {
    if (!cartOpen) return;
    function onClick(e: MouseEvent) {
      if (cartRef.current && !cartRef.current.contains(e.target as Node)) {
        setCartOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [cartOpen]);

  // Close popup on navigation
  useEffect(() => {
    setCartOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  }

  return (
    <>
      <header
        className="sticky top-0 z-50 transition-all duration-500"
        style={{
          background: scrolled ? "rgba(244, 241, 234, 0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid var(--bg-border)" : "1px solid transparent",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 transition-transform duration-300 hover:scale-[1.02]">
            <Image
              src="/img/logo.png"
              alt="The Pet Headquarters"
              width={40}
              height={40}
              className="rounded-full"
              priority
            />
            <span
              className="hidden sm:block"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "var(--text-lg)",
                fontWeight: "var(--weight-medium)",
                color: "var(--white)",
                letterSpacing: "var(--tracking-wide)",
              }}
            >
              The Pet Headquarters
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.key}
                  href={link.href}
                  className="relative px-4 py-2 transition-colors duration-200 hover:text-[var(--gold)]"
                  style={{
                    fontFamily: "var(--font-montserrat)",
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--weight-medium)",
                    color: isActive ? "var(--gold)" : "var(--white-dim)",
                    letterSpacing: "var(--tracking-wide)",
                  }}
                >
                  {dict[link.key]}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full"
                      style={{ background: "var(--gold)" }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setSearchOpen(!searchOpen); setMobileOpen(false); }}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 hover:bg-[rgba(187,148,41,0.1)] hover:text-[var(--gold)]"
              style={{ color: searchOpen ? "var(--gold)" : "var(--white-dim)" }}
            >
              {searchOpen ? <X size={18} /> : <Search size={18} />}
            </button>

            <div ref={cartRef} className="relative">
            <button
              onClick={() => { setCartOpen(!cartOpen); setSearchOpen(false); setMobileOpen(false); }}
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 hover:bg-[rgba(187,148,41,0.1)] hover:text-[var(--gold)]"
              style={{ color: cartOpen ? "var(--gold)" : "var(--white-dim)" }}
            >
              <ShoppingCart size={18} />
              {totalItems > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full"
                  style={{
                    background: "var(--gold)",
                    color: "var(--black)",
                    fontFamily: "var(--font-montserrat)",
                    fontSize: "10px",
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>
            <CartPopup open={cartOpen} onClose={() => setCartOpen(false)} />
            </div>

            <button
              onClick={() => { setMobileOpen(!mobileOpen); setSearchOpen(false); }}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 hover:bg-[rgba(187,148,41,0.1)] lg:hidden"
              style={{ color: mobileOpen ? "var(--gold)" : "var(--white-dim)" }}
            >
              <div className="relative h-4 w-5">
                <span
                  className="absolute left-0 h-[1.5px] w-full rounded-full transition-all duration-300"
                  style={{
                    background: mobileOpen ? "var(--gold)" : "var(--white-dim)",
                    top: mobileOpen ? "50%" : "0%",
                    transform: mobileOpen ? "rotate(45deg)" : "none",
                  }}
                />
                <span
                  className="absolute left-0 top-1/2 h-[1.5px] w-full rounded-full transition-all duration-300"
                  style={{
                    background: "var(--white-dim)",
                    opacity: mobileOpen ? 0 : 1,
                    transform: "translateY(-50%)",
                  }}
                />
                <span
                  className="absolute left-0 h-[1.5px] w-full rounded-full transition-all duration-300"
                  style={{
                    background: mobileOpen ? "var(--gold)" : "var(--white-dim)",
                    bottom: mobileOpen ? "auto" : "0%",
                    top: mobileOpen ? "50%" : "auto",
                    transform: mobileOpen ? "rotate(-45deg)" : "none",
                  }}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Search overlay */}
        <div
          className="overflow-hidden transition-all duration-400"
          style={{
            maxHeight: searchOpen ? 80 : 0,
            opacity: searchOpen ? 1 : 0,
            borderTop: searchOpen ? "1px solid var(--bg-border)" : "none",
            background: "var(--bg-secondary)",
          }}
        >
          <form onSubmit={handleSearch} className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 sm:px-6">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--white-faint)" }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={dict.search}
                autoFocus={searchOpen}
                className="w-full outline-none"
                style={{
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--bg-border)",
                  color: "var(--white)",
                  fontFamily: "var(--font-montserrat)",
                  fontSize: "var(--text-sm)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-2) var(--space-3) var(--space-2) var(--space-10)",
                }}
              />
            </div>
            <button
              type="submit"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 hover:bg-[var(--gold)] hover:text-[var(--black)]"
              style={{ background: "var(--bg-tertiary)", color: "var(--gold)", border: "1px solid var(--bg-border)" }}
            >
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </header>

      {/* Mobile fullscreen overlay menu */}
      <div
        className="fixed inset-0 z-40 flex flex-col transition-all duration-500 lg:hidden"
        style={{
          background: "var(--bg-primary)",
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? "all" : "none",
          transform: mobileOpen ? "none" : "translateY(-20px)",
        }}
      >
        {/* Spacer for header height */}
        <div className="h-16" />

        <nav className="flex flex-1 flex-col justify-center px-8">
          {navLinks.map((link, i) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
            <Link
              key={link.key}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="group flex items-center justify-between border-b py-5 transition-all duration-300"
              style={{
                borderColor: isActive ? "var(--gold)" : "var(--bg-border)",
                opacity: mobileOpen ? 1 : 0,
                transform: mobileOpen ? "none" : "translateX(-30px)",
                transitionDelay: mobileOpen ? `${i * 80}ms` : "0ms",
              }}
            >
              <span
                className="transition-colors duration-200 group-hover:text-[var(--gold)]"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "var(--text-3xl)",
                  fontWeight: "var(--weight-light)",
                  color: isActive ? "var(--gold)" : "var(--white)",
                }}
              >
                {dict[link.key]}
              </span>
              <ArrowRight
                size={20}
                className="transition-all duration-300 group-hover:translate-x-1"
                style={{ color: "var(--gold)", opacity: 0.5 }}
              />
            </Link>
            );
          })}
        </nav>

        {/* Bottom info */}
        <div className="px-8 pb-10">
          <div
            style={{ width: 40, height: 1, background: "var(--gold)", marginBottom: "var(--space-4)" }}
          />
          <p
            style={{
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-xs)",
              color: "var(--white-faint)",
              letterSpacing: "var(--tracking-wide)",
            }}
          >
            Premium products for your beloved companions.
          </p>
        </div>
      </div>
    </>
  );
}
