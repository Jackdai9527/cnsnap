"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { DashboardDateRange, DashboardTrends } from "@/types/dashboard";

export function useDashboardTrends(range: DashboardDateRange = "30d") {
  return useQuery({
    queryKey: ["admin-dashboard-trends", range],
    queryFn: () =>
      apiClient.get<DashboardTrends>("/api/admin/dashboard/trends", {
        params: { range }
      })
  });
}
