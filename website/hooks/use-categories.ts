"use client";

import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/config/endpoints";
import type { Category, CategoryDetail } from "@/types/category";
import type { PaginatedResponse, SuccessResponse } from "@/types/api";

async function fetchCategories(lang: string): Promise<Category[]> {
  const res = await fetch(`${endpoints.categories.list}?lang=${lang}`);
  const data: PaginatedResponse<Category> = await res.json();
  return data.results;
}

async function fetchCategoryTree(lang: string): Promise<CategoryDetail[]> {
  const res = await fetch(`${endpoints.categories.tree}?lang=${lang}`);
  const data: SuccessResponse<CategoryDetail[]> = await res.json();
  return data.data;
}

async function fetchCategoryBySlug(slug: string, lang: string): Promise<CategoryDetail> {
  const res = await fetch(`${endpoints.categories.detail(slug)}?lang=${lang}`);
  const data: SuccessResponse<CategoryDetail> = await res.json();
  return data.data;
}

export function useCategories(lang: string = "en") {
  return useQuery({
    queryKey: ["categories", lang],
    queryFn: () => fetchCategories(lang),
  });
}

export function useCategoryTree(lang: string = "en") {
  return useQuery({
    queryKey: ["categories", "tree", lang],
    queryFn: () => fetchCategoryTree(lang),
  });
}

export function useCategory(slug: string, lang: string = "en") {
  return useQuery({
    queryKey: ["categories", slug, lang],
    queryFn: () => fetchCategoryBySlug(slug, lang),
    enabled: !!slug,
  });
}
