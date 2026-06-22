"use client";

import dynamic from "next/dynamic";

const AdminDashboardClient = dynamic(
  () => import("@/components/admin/dashboard/AdminDashboardClient").then((module) => module.AdminDashboardClient),
  {
    ssr: false,
    loading: () => <div className="h-[320px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
  }
);

export function AdminDashboardEntry() {
  return <AdminDashboardClient />;
}
