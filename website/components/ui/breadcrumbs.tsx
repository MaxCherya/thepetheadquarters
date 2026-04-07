import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight size={14} style={{ color: "var(--white-faint)" }} />
            )}
            {item.href ? (
              <Link
                href={item.href}
                style={{
                  fontFamily: "var(--font-montserrat)",
                  fontSize: "var(--text-xs)",
                  color: "var(--white-faint)",
                  letterSpacing: "var(--tracking-wide)",
                }}
                className="hover:text-[var(--gold)]"
              >
                {item.label}
              </Link>
            ) : (
              <span
                style={{
                  fontFamily: "var(--font-montserrat)",
                  fontSize: "var(--text-xs)",
                  color: "var(--gold)",
                  letterSpacing: "var(--tracking-wide)",
                }}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
