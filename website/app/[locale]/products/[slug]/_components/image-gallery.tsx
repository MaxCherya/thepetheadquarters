"use client";

import { useState } from "react";
import Image from "next/image";
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
  const activeImage = sorted[activeIndex];

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
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div
        className="relative aspect-square w-full overflow-hidden rounded-lg"
        style={{ background: "var(--bg-secondary)" }}
      >
        <Image
          src={activeImage.url}
          alt={activeImage.alt_text || productName}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>

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
  );
}
