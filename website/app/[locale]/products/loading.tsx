"use client";

import { Skeleton } from "@heroui/react";

export default function ProductsLoading() {
  return (
    <main className="py-16 md:py-24" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Title */}
        <div className="mb-8 md:mb-12">
          <Skeleton className="mb-4 h-10 w-64 rounded-lg" />
          <Skeleton className="h-px w-16" />
        </div>

        <div className="flex gap-8">
          {/* Filter sidebar */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="flex flex-col gap-6">
              <Skeleton className="h-8 w-24 rounded" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="mb-2 h-4 w-20 rounded" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1">
            {/* Search + sort */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Skeleton className="h-10 flex-1 rounded-md" />
              <Skeleton className="h-10 w-48 rounded-md" />
            </div>

            <Skeleton className="mb-4 h-4 w-40 rounded" />

            {/* Product grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-lg" style={{ border: "1px solid var(--bg-border)" }}>
                  <Skeleton className="aspect-square w-full rounded-none" />
                  <div className="p-3 sm:p-4">
                    <Skeleton className="mb-2 h-5 w-3/4 rounded" />
                    <Skeleton className="h-5 w-1/3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
