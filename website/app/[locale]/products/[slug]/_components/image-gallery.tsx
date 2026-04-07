"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import type { ProductImage } from "@/types/product";

interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const sorted = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return a.sort_order - b.sort_order;
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const activeImage = sorted[activeIndex];

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % sorted.length);
  }, [sorted.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + sorted.length) % sorted.length);
  }, [sorted.length]);

  // Keyboard navigation in fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setFullscreen(false);
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [fullscreen, goNext, goPrev]);

  if (sorted.length === 0) {
    return (
      <div
        className="flex aspect-square w-full items-center justify-center rounded-lg"
        style={{ background: "var(--bg-secondary)", color: "var(--white-faint)" }}
      >
        No Image
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Main image */}
        <button
          onClick={() => setFullscreen(true)}
          className="group relative aspect-square w-full overflow-hidden rounded-lg"
          style={{ background: "var(--bg-secondary)" }}
        >
          <Image
            src={activeImage.url}
            alt={activeImage.alt_text || productName}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority
          />
          {/* Zoom hint */}
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: "rgba(0,0,0,0.3)" }}
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "rgba(0,0,0,0.6)", color: "var(--white)" }}
            >
              <ZoomIn size={20} />
            </div>
          </div>
        </button>

        {/* Thumbnails */}
        {sorted.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {sorted.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveIndex(i)}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md transition-opacity duration-200 hover:opacity-100 sm:h-20 sm:w-20"
                style={{
                  background: "var(--bg-secondary)",
                  border: i === activeIndex ? "2px solid var(--gold)" : "1px solid var(--bg-border)",
                  opacity: i === activeIndex ? 1 : 0.6,
                }}
              >
                <Image
                  src={img.url}
                  alt={img.alt_text || `${productName} ${i + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen viewer */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: "rgba(0, 0, 0, 0.95)" }}
        >
          {/* Close */}
          <button
            onClick={() => setFullscreen(false)}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:bg-[rgba(255,255,255,0.1)]"
            style={{ color: "var(--white)" }}
          >
            <X size={24} />
          </button>

          {/* Counter */}
          <div
            className="absolute left-4 top-4 z-10 rounded-full px-3 py-1"
            style={{
              background: "rgba(0,0,0,0.6)",
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-xs)",
              color: "var(--white-dim)",
            }}
          >
            {activeIndex + 1} / {sorted.length}
          </div>

          {/* Previous */}
          {sorted.length > 1 && (
            <button
              onClick={goPrev}
              className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 hover:bg-[rgba(255,255,255,0.1)]"
              style={{ color: "var(--white)" }}
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Image */}
          <div className="relative h-[85vh] w-[90vw] sm:h-[90vh] sm:w-[85vw]">
            <Image
              src={sorted[activeIndex].url}
              alt={sorted[activeIndex].alt_text || productName}
              fill
              sizes="90vw"
              className="object-contain"
              priority
            />
          </div>

          {/* Next */}
          {sorted.length > 1 && (
            <button
              onClick={goNext}
              className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 hover:bg-[rgba(255,255,255,0.1)]"
              style={{ color: "var(--white)" }}
            >
              <ChevronRight size={28} />
            </button>
          )}

          {/* Thumbnails strip */}
          {sorted.length > 1 && (
            <div className="absolute bottom-4 z-10 flex gap-2">
              {sorted.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveIndex(i)}
                  className="relative h-12 w-12 shrink-0 overflow-hidden rounded transition-opacity duration-200 hover:opacity-100 sm:h-16 sm:w-16"
                  style={{
                    border: i === activeIndex ? "2px solid var(--gold)" : "1px solid rgba(255,255,255,0.2)",
                    opacity: i === activeIndex ? 1 : 0.5,
                  }}
                >
                  <Image
                    src={img.url}
                    alt={img.alt_text || `${productName} ${i + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Click backdrop to close */}
          <div className="absolute inset-0 -z-10" onClick={() => setFullscreen(false)} />
        </div>
      )}
    </>
  );
}
