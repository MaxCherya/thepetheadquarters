"use client";

import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/config/endpoints";
import type { Brand, BrandDetail } from "@/types/brand";
import type { PaginatedResponse, SuccessResponse } from "@/types/api";

async function fetchBrands(lang: string): Promise<Brand[]> {
  const res = await fetch(`${endpoints.brands.list}?lang=${lang}`);
  const data: PaginatedResponse<Brand> = await res.json();
  return data.results;
}

async function fetchBrandBySlug(slug: string, lang: string): Promise<BrandDetail> {
  const res = await fetch(`${endpoints.brands.detail(slug)}?lang=${lang}`);
  const data: SuccessResponse<BrandDetail> = await res.json();
  return data.data;
}

export function useBrands(lang: string = "en") {
  return useQuery({
    queryKey: ["brands", lang],
    queryFn: () => fetchBrands(lang),
  });
}

export function useBrand(slug: string, lang: string = "en") {
  return useQuery({
    queryKey: ["brands", slug, lang],
    queryFn: () => fetchBrandBySlug(slug, lang),
    enabled: !!slug,
  });
}
