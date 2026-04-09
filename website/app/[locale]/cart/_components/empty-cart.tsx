import Link from "next/link";
import { ShoppingCart } from "lucide-react";

interface EmptyCartProps {
  dict: {
    title: string;
    description: string;
    cta: string;
  };
}

export function EmptyCart({ dict }: EmptyCartProps) {
  return (
    <div className="flex flex-col items-center py-20">
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
        style={{ background: "rgba(187,148,41,0.1)", border: "1px solid rgba(187,148,41,0.2)" }}
      >
        <ShoppingCart size={32} style={{ color: "var(--gold)" }} />
      </div>
      <h2
        className="mb-3"
        style={{
          fontFamily: "var(--font-cormorant)",
          fontSize: "var(--text-2xl)",
          fontWeight: "var(--weight-regular)",
          color: "var(--white)",
        }}
      >
        {dict.title}
      </h2>
      <p
        className="mb-8 max-w-sm text-center"
        style={{
          fontFamily: "var(--font-montserrat)",
          fontSize: "var(--text-sm)",
          color: "var(--white-dim)",
          lineHeight: "var(--leading-relaxed)",
        }}
      >
        {dict.description}
      </p>
      <Link
        href="/products"
        className="btn-gold inline-block transition-all duration-300 hover:-translate-y-0.5"
        style={{
          fontFamily: "var(--font-montserrat)",
          fontWeight: "var(--weight-semibold)",
          fontSize: "var(--text-sm)",
          letterSpacing: "var(--tracking-wider)",
          textTransform: "uppercase",
          padding: "var(--space-3) var(--space-8)",
          borderRadius: "var(--radius-md)",
        }}
      >
        {dict.cta}
      </Link>
    </div>
  );
}
