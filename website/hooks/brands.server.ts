import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import type { Brand, BrandDetail } from "@/types/brand";
import type { PaginatedResponse, SuccessResponse } from "@/types/api";

export async function getBrands(lang: string = "en"): Promise<Brand[]> {
  const response = await apiClient.get<PaginatedResponse<Brand>>(
    endpoints.brands.list,
    { lang },
  );
  return response.results;
}

export async function getBrandBySlug(slug: string, lang: string = "en"): Promise<BrandDetail> {
  const response = await apiClient.get<SuccessResponse<BrandDetail>>(
    endpoints.brands.detail(slug),
    { lang },
  );
  return response.data;
}
