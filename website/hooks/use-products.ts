"use client";

import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/config/endpoints";
import type { Product, ProductDetail } from "@/types/product";
import type { PaginatedResponse, SuccessResponse } from "@/types/api";

async function fetchProducts(params: Record<string, string> = {}, lang: string): Promise<PaginatedResponse<Product>> {
  const searchParams = new URLSearchParams({ lang, ...params });
  const res = await fetch(`${endpoints.products.list}?${searchParams}`);
  return res.json();
}

async function fetchFeaturedProducts(lang: string): Promise<Product[]> {
  const res = await fetch(`${endpoints.products.featured}?lang=${lang}`);
  const data: PaginatedResponse<Product> = await res.json();
  return data.results;
}

async function fetchProductBySlug(slug: string, lang: string): Promise<ProductDetail> {
  const res = await fetch(`${endpoints.products.detail(slug)}?lang=${lang}`);
  const data: SuccessResponse<ProductDetail> = await res.json();
  return data.data;
}

export function useProducts(params: Record<string, string> = {}, lang: string = "en") {
  return useQuery({
    queryKey: ["products", params, lang],
    queryFn: () => fetchProducts(params, lang),
  });
}

export function useFeaturedProducts(lang: string = "en") {
  return useQuery({
    queryKey: ["products", "featured", lang],
    queryFn: () => fetchFeaturedProducts(lang),
  });
}

export function useProduct(slug: string, lang: string = "en") {
  return useQuery({
    queryKey: ["products", slug, lang],
    queryFn: () => fetchProductBySlug(slug, lang),
    enabled: !!slug,
  });
}
