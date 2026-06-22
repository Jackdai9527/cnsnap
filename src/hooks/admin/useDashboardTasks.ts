"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { DashboardDateRange, DashboardTasks } from "@/types/dashboard";

export function useDashboardTasks(range: DashboardDateRange = "30d") {
  return useQuery({
    queryKey: ["admin-dashboard-tasks", range],
    queryFn: () =>
      apiClient.get<DashboardTasks>("/api/admin/dashboard/tasks", {
        params: { range }
      })
  });
}
