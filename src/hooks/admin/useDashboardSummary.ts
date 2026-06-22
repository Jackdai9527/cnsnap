"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { DashboardDateRange, DashboardSummary } from "@/types/dashboard";

export function useDashboardSummary(range: DashboardDateRange = "today") {
  return useQuery({
    queryKey: ["admin-dashboard-summary", range],
    queryFn: () =>
      apiClient.get<DashboardSummary>("/api/admin/dashboard/summary", {
        params: { range }
      })
  });
}
