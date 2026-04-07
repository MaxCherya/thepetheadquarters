"use client";

import { Skeleton } from "@heroui/react";

export default function ProductLoading() {
  return (
    <main className="py-8 md:py-16" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Breadcrumb skeleton */}
        <div className="mb-6 flex gap-2">
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-32 rounded" />
        </div>

        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          {/* Image skeleton */}
          <div>
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-16 w-16 rounded-md sm:h-20 sm:w-20" />
              <Skeleton className="h-16 w-16 rounded-md sm:h-20 sm:w-20" />
              <Skeleton className="h-16 w-16 rounded-md sm:h-20 sm:w-20" />
            </div>
          </div>

          {/* Info skeleton */}
          <div className="flex flex-col gap-5">
            <Skeleton className="h-10 w-3/4 rounded" />
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-8 w-32 rounded" />
            <Skeleton className="h-16 w-full rounded" />
            <Skeleton className="h-px w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 rounded-md" />
              <Skeleton className="h-10 w-24 rounded-md" />
              <Skeleton className="h-10 w-24 rounded-md" />
            </div>
            <Skeleton className="h-4 w-20 rounded" />
            <div className="flex gap-3">
              <Skeleton className="h-11 w-36 rounded-md" />
              <Skeleton className="h-11 flex-1 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
