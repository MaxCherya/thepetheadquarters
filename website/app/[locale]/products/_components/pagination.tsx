"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  dict: { previous: string; next: string };
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ dict, currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex items-center gap-1 rounded-md px-3 py-2 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-30"
        style={{
          background: "var(--bg-tertiary)",
          border: "1px solid var(--bg-border)",
          color: "var(--white-dim)",
          fontFamily: "var(--font-montserrat)",
          fontSize: "var(--text-sm)",
        }}
      >
        <ChevronLeft size={16} />
        {dict.previous}
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className="h-9 w-9 rounded-md transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: page === currentPage ? "var(--gold)" : "var(--bg-tertiary)",
            color: page === currentPage ? "var(--black)" : "var(--white-dim)",
            border: `1px solid ${page === currentPage ? "var(--gold)" : "var(--bg-border)"}`,
            fontFamily: "var(--font-montserrat)",
            fontSize: "var(--text-sm)",
            fontWeight: page === currentPage ? "var(--weight-semibold)" : "var(--weight-regular)",
          }}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex items-center gap-1 rounded-md px-3 py-2 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-30"
        style={{
          background: "var(--bg-tertiary)",
          border: "1px solid var(--bg-border)",
          color: "var(--white-dim)",
          fontFamily: "var(--font-montserrat)",
          fontSize: "var(--text-sm)",
        }}
      >
        {dict.next}
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
