import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import type { Category, CategoryDetail } from "@/types/category";
import type { PaginatedResponse, SuccessResponse } from "@/types/api";

export async function getRootCategories(lang: string = "en"): Promise<Category[]> {
  const response = await apiClient.get<PaginatedResponse<Category>>(
    endpoints.categories.list,
    { lang },
  );
  return response.results;
}

export async function getCategoryTree(lang: string = "en"): Promise<CategoryDetail[]> {
  const response = await apiClient.get<SuccessResponse<CategoryDetail[]>>(
    endpoints.categories.tree,
    { lang },
  );
  return response.data;
}

export async function getCategoryBySlug(slug: string, lang: string = "en"): Promise<CategoryDetail> {
  const response = await apiClient.get<SuccessResponse<CategoryDetail>>(
    endpoints.categories.detail(slug),
    { lang },
  );
  return response.data;
}
