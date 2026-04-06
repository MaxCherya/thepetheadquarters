"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  dict: { previous: string; next: string; page: string; of: string };
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ dict, currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  let start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  start = Math.max(1, end - 4);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const btnBase = "flex h-9 w-9 items-center justify-center rounded-md transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-30";

  return (
    <div className="mt-10 flex flex-col items-center gap-4">
      <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "var(--text-xs)", color: "var(--white-faint)" }}>
        {dict.page} {currentPage} {dict.of} {totalPages}
      </span>

      <div className="flex items-center gap-1.5">
        <button onClick={() => onPageChange(1)} disabled={currentPage <= 1} className={btnBase}
          style={{ background: "var(--bg-tertiary)", color: "var(--white-dim)", border: "1px solid var(--bg-border)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)" }}>
          <ChevronsLeft size={16} />
        </button>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1} className={btnBase}
          style={{ background: "var(--bg-tertiary)", color: "var(--white-dim)", border: "1px solid var(--bg-border)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)" }}>
          <ChevronLeft size={16} />
        </button>

        {start > 1 && <span style={{ color: "var(--white-faint)", fontSize: "var(--text-sm)", padding: "0 4px" }}>...</span>}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={btnBase}
            style={{
              background: page === currentPage ? "var(--gold)" : "var(--bg-tertiary)",
              color: page === currentPage ? "var(--black)" : "var(--white-dim)",
              border: `1px solid ${page === currentPage ? "var(--gold)" : "var(--bg-border)"}`,
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-sm)",
              fontWeight: page === currentPage ? 600 : 400,
            }}
          >
            {page}
          </button>
        ))}

        {end < totalPages && <span style={{ color: "var(--white-faint)", fontSize: "var(--text-sm)", padding: "0 4px" }}>...</span>}

        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} className={btnBase}
          style={{ background: "var(--bg-tertiary)", color: "var(--white-dim)", border: "1px solid var(--bg-border)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)" }}>
          <ChevronRight size={16} />
        </button>
        <button onClick={() => onPageChange(totalPages)} disabled={currentPage >= totalPages} className={btnBase}
          style={{ background: "var(--bg-tertiary)", color: "var(--white-dim)", border: "1px solid var(--bg-border)", fontFamily: "var(--font-montserrat)", fontSize: "var(--text-sm)" }}>
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}
