"use client";

import { Skeleton } from "@heroui/react";

export default function HomeLoading() {
  return (
    <main>
      {/* Hero */}
      <section
        className="relative flex min-h-[80vh] items-center py-20 md:min-h-screen md:py-0"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <Skeleton className="mb-6 h-8 w-48 rounded-full" />
            <Skeleton className="mb-4 h-16 w-full rounded-lg sm:h-20" />
            <Skeleton className="mb-10 h-12 w-3/4 rounded-lg" />
            <div className="flex gap-4">
              <Skeleton className="h-12 w-36 rounded-md" />
              <Skeleton className="h-12 w-48 rounded-md" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24" style={{ background: "var(--bg-primary)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex flex-col items-center md:mb-12">
            <Skeleton className="mb-4 h-4 w-32 rounded" />
            <Skeleton className="mb-4 h-8 w-56 rounded" />
            <Skeleton className="h-px w-16" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-lg" style={{ border: "1px solid var(--bg-border)" }}>
                <Skeleton className="aspect-square w-full rounded-none" />
                <div className="flex justify-center p-4">
                  <Skeleton className="h-5 w-20 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-16 md:py-24" style={{ background: "var(--bg-secondary)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex flex-col items-center md:mb-12">
            <Skeleton className="mb-4 h-4 w-36 rounded" />
            <Skeleton className="mb-4 h-8 w-48 rounded" />
            <Skeleton className="h-px w-16" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-lg" style={{ border: "1px solid var(--bg-border)" }}>
                <Skeleton className="aspect-square w-full rounded-none" />
                <div className="p-4">
                  <Skeleton className="mb-2 h-5 w-3/4 rounded" />
                  <Skeleton className="h-5 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-16 md:py-24" style={{ background: "var(--bg-primary)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <Skeleton className="mb-4 h-14 w-14 rounded-full" />
                <Skeleton className="mb-2 h-4 w-24 rounded" />
                <Skeleton className="h-3 w-32 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 md:py-24" style={{ background: "var(--bg-secondary)" }}>
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="flex flex-col items-center">
            <Skeleton className="mb-4 h-4 w-28 rounded" />
            <Skeleton className="mb-4 h-8 w-72 rounded" />
            <Skeleton className="mb-8 h-4 w-80 rounded" />
            <div className="flex w-full gap-3">
              <Skeleton className="h-11 flex-1 rounded-md" />
              <Skeleton className="h-11 w-32 rounded-md" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
