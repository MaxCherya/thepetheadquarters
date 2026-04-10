"use client";

import { useState } from "react";
import type { ProductAttribute } from "@/hooks/attributes.server";
import { ProductSpecs } from "./product-specs";
import { ReviewsTab } from "./reviews-tab";

interface ProductTabsProps {
  description: string;
  attributes: ProductAttribute[];
  dict: {
    description: string;
    specifications: string;
    reviews: string;
  };
  reviewCount: number;
  slug: string;
}

export function ProductTabs({ description, attributes, dict, reviewCount, slug }: ProductTabsProps) {
  const tabs = [
    { key: "description", label: dict.description },
    ...(attributes.length > 0
      ? [{ key: "specs", label: dict.specifications }]
      : []),
    { key: "reviews", label: `${dict.reviews} (${reviewCount})` },
  ];

  const [activeTab, setActiveTab] = useState("description");

  return (
    <div className="mt-12">
      {/* Tab headers */}
      <div
        className="flex gap-0 overflow-x-auto border-b"
        style={{ borderColor: "var(--bg-border)" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="whitespace-nowrap px-4 py-3 transition-all duration-200 sm:px-6"
            style={{
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-sm)",
              fontWeight: activeTab === tab.key ? "var(--weight-semibold)" : "var(--weight-regular)",
              color: activeTab === tab.key ? "var(--gold)" : "var(--white-faint)",
              borderBottom: activeTab === tab.key ? "2px solid var(--gold)" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="py-8">
        {activeTab === "description" && (
          <div
            className="product-description"
            style={{
              fontFamily: "var(--font-montserrat)",
              fontSize: "var(--text-base)",
              color: "var(--white-dim)",
              lineHeight: "var(--leading-relaxed)",
            }}
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}

        {activeTab === "specs" && (
          <ProductSpecs attributes={attributes} title={dict.specifications} />
        )}

        {activeTab === "reviews" && <ReviewsTab slug={slug} />}
      </div>
    </div>
  );
}
