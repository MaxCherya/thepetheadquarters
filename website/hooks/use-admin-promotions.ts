"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import type { PaginatedResponse } from "@/types/api";
import type {
  AdminPromotion,
  AdminPromotionListItem,
  AdminPromotionRedemption,
  PromotionDiscountType,
  PromotionScope,
  PromotionSource,
} from "@/types/admin";

export const adminPromotionKeys = {
  all: ["admin", "promotions"] as const,
  list: (qs: string) => [...adminPromotionKeys.all, "list", qs] as const,
  detail: (id: string) => [...adminPromotionKeys.all, "detail", id] as const,
  redemptions: (id: string) => [...adminPromotionKeys.all, "redemptions", id] as const,
};

export interface PromotionFormData {
  code?: string;
  name: string;
  description?: string;
  discount_type: PromotionDiscountType;
  discount_value?: number;
  scope?: PromotionScope;
  scope_category_ids?: string[];
  scope_brand_ids?: string[];
  scope_product_ids?: string[];
  min_subtotal?: number;
  is_first_order_only?: boolean;
  is_one_per_customer?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  max_uses_total?: number | null;
  max_uses_per_user?: number | null;
  is_active?: boolean;
  source?: PromotionSource;
  campaign_label?: string;
}

export function useAdminPromotions(queryString: string) {
  return useQuery({
    queryKey: adminPromotionKeys.list(queryString),
    queryFn: async () => {
      const url = `${endpoints.admin.promotions.list}${queryString ? `?${queryString}` : ""}`;
      return apiClient.get<PaginatedResponse<AdminPromotionListItem>>(url);
    },
  });
}

export function useAdminPromotion(promotionId: string) {
  return useQuery({
    queryKey: adminPromotionKeys.detail(promotionId),
    queryFn: async () => {
      const res = await apiClient.get<{ status: string; data: AdminPromotion }>(
        endpoints.admin.promotions.detail(promotionId),
      );
      return res.data;
    },
    enabled: !!promotionId,
  });
}

export function useAdminPromotionRedemptions(promotionId: string) {
  return useQuery({
    queryKey: adminPromotionKeys.redemptions(promotionId),
    queryFn: async () => {
      return apiClient.get<PaginatedResponse<AdminPromotionRedemption>>(
        endpoints.admin.promotions.redemptions(promotionId),
      );
    },
    enabled: !!promotionId,
  });
}

export function useCreatePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: PromotionFormData) => {
      const res = await apiClient.post<{ status: string; data: AdminPromotion }>(
        endpoints.admin.promotions.list,
        data,
      );
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: adminPromotionKeys.all }),
  });
}

export function useUpdatePromotion(promotionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PromotionFormData>) => {
      return apiClient.patch(endpoints.admin.promotions.detail(promotionId), data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: adminPromotionKeys.all }),
  });
}

export function useDeletePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (promotionId: string) => {
      return apiClient.del(endpoints.admin.promotions.detail(promotionId));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: adminPromotionKeys.all }),
  });
}
