"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/config/endpoints";
import type { AdminOrder, AdminOrderListItem, CarrierCode } from "@/types/admin";
import type { PaginatedResponse } from "@/types/api";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------
export const adminOrderKeys = {
  all: ["admin", "orders"] as const,
  lists: () => [...adminOrderKeys.all, "list"] as const,
  list: (filters: Record<string, string>) =>
    [...adminOrderKeys.lists(), filters] as const,
  details: () => [...adminOrderKeys.all, "detail"] as const,
  detail: (orderNumber: string) =>
    [...adminOrderKeys.details(), orderNumber] as const,
  dashboard: ["admin", "dashboard"] as const,
};

// ---------------------------------------------------------------------------
// List query
// ---------------------------------------------------------------------------
export function useAdminOrders(filters: Record<string, string>) {
  return useQuery({
    queryKey: adminOrderKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      const url = `${endpoints.admin.orders.list}${params.toString() ? `?${params.toString()}` : ""}`;
      return apiClient.get<PaginatedResponse<AdminOrderListItem>>(url);
    },
    staleTime: 30 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Detail query
// ---------------------------------------------------------------------------
export function useAdminOrder(orderNumber: string) {
  return useQuery({
    queryKey: adminOrderKeys.detail(orderNumber),
    queryFn: async () => {
      const res = await apiClient.get<{ status: string; data: AdminOrder }>(
        endpoints.admin.orders.detail(orderNumber),
      );
      return res.data;
    },
    staleTime: 10 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Mutations — all invalidate detail + list + dashboard cache
// ---------------------------------------------------------------------------
function useInvalidate(orderNumber: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: adminOrderKeys.detail(orderNumber) });
    qc.invalidateQueries({ queryKey: adminOrderKeys.lists() });
    qc.invalidateQueries({ queryKey: adminOrderKeys.dashboard });
  };
}

export function useShipOrder(orderNumber: string) {
  const invalidate = useInvalidate(orderNumber);
  return useMutation({
    mutationFn: async (data: {
      carrier: CarrierCode;
      tracking_number: string;
      tracking_url: string;
    }) => {
      return apiClient.post<{ status: string; data: AdminOrder }>(
        endpoints.admin.orders.ship(orderNumber),
        data,
      );
    },
    onSuccess: invalidate,
  });
}

export function useCancelOrder(orderNumber: string) {
  const invalidate = useInvalidate(orderNumber);
  return useMutation({
    mutationFn: async (reason: string) => {
      return apiClient.post(endpoints.admin.orders.cancel(orderNumber), { reason });
    },
    onSuccess: invalidate,
  });
}

export function useRefundOrder(orderNumber: string) {
  const invalidate = useInvalidate(orderNumber);
  return useMutation({
    mutationFn: async () => {
      return apiClient.post(endpoints.admin.orders.refund(orderNumber), {});
    },
    onSuccess: invalidate,
  });
}

export function useTransitionOrderStatus(orderNumber: string) {
  const invalidate = useInvalidate(orderNumber);
  return useMutation({
    mutationFn: async (status: string) => {
      return apiClient.post(endpoints.admin.orders.status(orderNumber), { status });
    },
    onSuccess: invalidate,
  });
}

export function useUpdateOrderNotes(orderNumber: string) {
  const invalidate = useInvalidate(orderNumber);
  return useMutation({
    mutationFn: async (internal_notes: string) => {
      return apiClient.patch(endpoints.admin.orders.notes(orderNumber), {
        internal_notes,
      });
    },
    onSuccess: invalidate,
  });
}
