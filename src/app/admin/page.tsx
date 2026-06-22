import { AdminDashboardEntry } from "@/components/admin/dashboard/AdminDashboardEntry";
import { requirePermission } from "@/lib/admin-session";

export default async function AdminHomePage() {
  await requirePermission("dashboard.view");

  return <AdminDashboardEntry />;
}
