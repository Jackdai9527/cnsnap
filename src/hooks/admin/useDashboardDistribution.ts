"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { DashboardDateRange, DashboardDistribution } from "@/types/dashboard";

export function useDashboardDistribution(range: DashboardDateRange = "30d") {
  return useQuery({
    queryKey: ["admin-dashboard-distribution", range],
    queryFn: () =>
      apiClient.get<DashboardDistribution>("/api/admin/dashboard/distribution", {
        params: { range }
      })
  });
}
