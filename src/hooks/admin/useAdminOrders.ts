"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { SortingState } from "@tanstack/react-table";
import { apiClient } from "@/lib/api-client";
import type { MockOrder, OrderTabKey } from "@/types/admin-orders";

export type AdminOrdersFilters = {
  search?: string;
  orderStatus?: OrderTabKey;
  paymentStatus?: string;
  purchaseStatus?: string;
  warehouseStatus?: string;
  packageStatus?: string;
  shippingStatus?: string;
  shippingPaymentStatus?: string;
  riskStatus?: string;
  refundStatus?: string;
  destinationCountry?: string;
  assignee?: string;
  created?: string;
  paidAt?: string;
  view?: "active" | "trash";
};

export type AdminOrdersPagination = {
  page: number;
  pageSize: number;
};

export type AdminOrdersSorting = SortingState;

export type AdminOrdersResponse = {
  data: MockOrder[];
  meta: {
    pageIndex: number;
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
    statusCounts: Record<OrderTabKey, number>;
  };
};

export type UpdateOrderStatusInput = {
  orderId: string;
  field: "paymentStatus" | "purchaseStatus" | "warehouseStatus" | "packageStatus" | "shippingStatus" | "riskStatus";
  status: string;
};

export type MoveOrderToTrashInput = {
  orderId: string;
};

export type RestoreOrderInput = {
  orderId: string;
};

export type PermanentlyDeleteOrderInput = {
  orderId: string;
};

export type BulkOrderActionInput = {
  orderIds: string[];
};

type MoveOrderToTrashRequest = MoveOrderToTrashInput & {
  field: "riskStatus";
  status: "__move_to_trash__";
};

type RestoreOrderRequest = RestoreOrderInput & {
  field: "riskStatus";
  status: "__restore_from_trash__";
};

type PermanentlyDeleteOrderRequest = PermanentlyDeleteOrderInput & {
  field: "riskStatus";
  status: "__permanently_delete__";
};

type BulkMoveOrderToTrashRequest = BulkOrderActionInput & {
  field: "riskStatus";
  status: "__bulk_move_to_trash__";
};

type BulkRestoreOrderRequest = BulkOrderActionInput & {
  field: "riskStatus";
  status: "__bulk_restore_from_trash__";
};

type BulkPermanentlyDeleteOrderRequest = BulkOrderActionInput & {
  field: "riskStatus";
  status: "__bulk_permanently_delete__";
};

export const adminOrdersQueryKey = "admin-orders";

export function useAdminOrders({
  filters = {},
  pagination = { page: 1, pageSize: 25 },
  sorting = []
}: {
  filters?: AdminOrdersFilters;
  pagination?: AdminOrdersPagination;
  sorting?: AdminOrdersSorting;
} = {}) {
  const activeSort = sorting[0];

  return useQuery({
    queryKey: [adminOrdersQueryKey, filters, pagination, sorting],
    queryFn: () =>
      apiClient.get<AdminOrdersResponse>("/api/admin/orders", {
        params: {
          ...filters,
          page: pagination.page,
          pageSize: pagination.pageSize,
          sortBy: activeSort?.id,
          sortDir: activeSort ? (activeSort.desc ? "desc" : "asc") : undefined
        }
      })
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateOrderStatusInput) =>
      apiClient.patch<{ data: MockOrder; message: string }, UpdateOrderStatusInput>("/api/admin/orders", input),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: [adminOrdersQueryKey] });
      toast.success(result.message || "Order status updated.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update order status.");
    }
  });
}

export function useMoveOrderToTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId }: MoveOrderToTrashInput) =>
      apiClient.patch<{ message: string }, MoveOrderToTrashRequest>("/api/admin/orders", {
        orderId,
        field: "riskStatus",
        status: "__move_to_trash__"
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: [adminOrdersQueryKey] });
      toast.success(result.message || "Order moved to trash.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to move order to trash.");
    }
  });
}

export function useRestoreOrderFromTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId }: RestoreOrderInput) =>
      apiClient.patch<{ message: string }, RestoreOrderRequest>("/api/admin/orders", {
        orderId,
        field: "riskStatus",
        status: "__restore_from_trash__"
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: [adminOrdersQueryKey] });
      toast.success(result.message || "Order restored.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to restore order.");
    }
  });
}

export function usePermanentlyDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId }: PermanentlyDeleteOrderInput) =>
      apiClient.patch<{ message: string }, PermanentlyDeleteOrderRequest>("/api/admin/orders", {
        orderId,
        field: "riskStatus",
        status: "__permanently_delete__"
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: [adminOrdersQueryKey] });
      toast.success(result.message || "Order permanently deleted.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to permanently delete order.");
    }
  });
}

export function useBulkMoveOrdersToTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderIds }: BulkOrderActionInput) =>
      apiClient.patch<{ message: string }, BulkMoveOrderToTrashRequest>("/api/admin/orders", {
        orderIds,
        field: "riskStatus",
        status: "__bulk_move_to_trash__"
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: [adminOrdersQueryKey] });
      toast.success(result.message || "Selected orders moved to trash.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to move selected orders to trash.");
    }
  });
}

export function useBulkRestoreOrdersFromTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderIds }: BulkOrderActionInput) =>
      apiClient.patch<{ message: string }, BulkRestoreOrderRequest>("/api/admin/orders", {
        orderIds,
        field: "riskStatus",
        status: "__bulk_restore_from_trash__"
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: [adminOrdersQueryKey] });
      toast.success(result.message || "Selected orders restored.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to restore selected orders.");
    }
  });
}

export function useBulkPermanentlyDeleteOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderIds }: BulkOrderActionInput) =>
      apiClient.patch<{ message: string }, BulkPermanentlyDeleteOrderRequest>("/api/admin/orders", {
        orderIds,
        field: "riskStatus",
        status: "__bulk_permanently_delete__"
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: [adminOrdersQueryKey] });
      toast.success(result.message || "Selected orders permanently deleted.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to permanently delete selected orders.");
    }
  });
}
