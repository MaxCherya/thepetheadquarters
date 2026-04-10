"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import type { PaginatedResponse } from "@/types/api";
import type {
  MyReview,
  Review,
  ReviewEligibility,
  ReviewSort,
  ReviewStats,
} from "@/types/review";

export const reviewKeys = {
  all: ["reviews"] as const,
  list: (slug: string, sort: ReviewSort, rating: number | null) =>
    [...reviewKeys.all, "list", slug, sort, rating] as const,
  stats: (slug: string) => [...reviewKeys.all, "stats", slug] as const,
  eligibility: (slug: string) => [...reviewKeys.all, "eligibility", slug] as const,
  mine: ["reviews", "mine"] as const,
};

export function useProductReviews(slug: string, sort: ReviewSort = "newest", rating: number | null = null) {
  return useQuery({
    queryKey: reviewKeys.list(slug, sort, rating),
    queryFn: async () => {
      const params = new URLSearchParams({ sort });
      if (rating) params.set("rating", String(rating));
      return apiClient.get<PaginatedResponse<Review>>(
        `${endpoints.reviews.list(slug)}?${params.toString()}`,
      );
    },
    enabled: !!slug,
  });
}

export function useReviewStats(slug: string) {
  return useQuery({
    queryKey: reviewKeys.stats(slug),
    queryFn: async () => {
      const res = await apiClient.get<{ status: string; data: ReviewStats }>(
        endpoints.reviews.stats(slug),
      );
      return res.data;
    },
    enabled: !!slug,
  });
}

export function useReviewEligibility(slug: string) {
  return useQuery({
    queryKey: reviewKeys.eligibility(slug),
    queryFn: async () => {
      const res = await apiClient.get<{ status: string; data: ReviewEligibility }>(
        endpoints.reviews.eligibility(slug),
      );
      return res.data;
    },
    enabled: !!slug,
    // Eligibility depends on auth state which can change in another tab
    // (login, logout, account creation). Always refetch on mount/focus
    // so a stale "login_required" never blocks a logged-in user.
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

interface ReviewFormData {
  rating: number;
  title: string;
  body: string;
}

// Centralised cache-busting helper. Awaits the refetch so callers can rely on
// the list/stats/eligibility queries being up-to-date by the time their
// `await mutation.mutateAsync(...)` call resolves.
async function invalidateAllReviews(qc: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    qc.invalidateQueries({ queryKey: reviewKeys.all, refetchType: "all" }),
    // The product detail page caches `average_rating` + `review_count` from
    // the public products endpoint, so any review write should also bust
    // that cache when applicable.
    qc.invalidateQueries({ queryKey: ["products"] }),
  ]);
}

export function useCreateReview(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const res = await apiClient.post<{ status: string; data: Review }>(
        endpoints.reviews.list(slug),
        data,
      );
      return res.data;
    },
    onSuccess: () => invalidateAllReviews(qc),
  });
}

export function useUpdateReview(slug: string, reviewId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ReviewFormData>) => {
      const res = await apiClient.patch<{ status: string; data: Review }>(
        endpoints.reviews.detail(slug, reviewId),
        data,
      );
      return res.data;
    },
    onSuccess: () => invalidateAllReviews(qc),
  });
}

export function useDeleteReview(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reviewId: string) => {
      return apiClient.del(endpoints.reviews.detail(slug, reviewId));
    },
    onSuccess: () => invalidateAllReviews(qc),
  });
}

export function useToggleHelpful(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reviewId: string) => {
      return apiClient.post<{ status: string; data: { helpful_count: number; has_voted_helpful: boolean } }>(
        endpoints.reviews.helpful(slug, reviewId),
      );
    },
    onSuccess: () => invalidateAllReviews(qc),
  });
}

export function useMyReviews() {
  return useQuery({
    queryKey: reviewKeys.mine,
    queryFn: async () => {
      return apiClient.get<PaginatedResponse<MyReview>>(endpoints.reviews.mine);
    },
  });
}
