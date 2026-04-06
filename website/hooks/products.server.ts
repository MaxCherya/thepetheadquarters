import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import type { Product, ProductDetail } from "@/types/product";
import type { PaginatedResponse } from "@/types/api";

export async function getProducts(
  params: Record<string, string> = {},
  lang: string = "en",
): Promise<PaginatedResponse<Product>> {
  return apiClient.get<PaginatedResponse<Product>>(
    endpoints.products.list,
    { lang, ...params },
  );
}

export async function getFeaturedProducts(lang: string = "en"): Promise<Product[]> {
  const response = await apiClient.get<PaginatedResponse<Product>>(
    endpoints.products.featured,
    { lang },
  );
  return response.results;
}

export async function getNewArrivals(lang: string = "en", limit: number = 8): Promise<Product[]> {
  const response = await apiClient.get<PaginatedResponse<Product>>(
    endpoints.products.list,
    { lang, ordering: "-created_at", page_size: String(limit) },
  );
  return response.results;
}

export async function getProductBySlug(slug: string, lang: string = "en"): Promise<ProductDetail> {
  const response = await apiClient.getSuccess<ProductDetail>(
    endpoints.products.detail(slug),
    { lang },
  );
  return response;
}
