import { notFound } from "next/navigation";
import CatchAllAdminPage from "@/app/_admin/[...slug]/page";
import AdminAuthSettingsPage from "@/app/_admin/auth/page";
import AdminDiyOrdersPage from "@/app/_admin/diy-orders/page";
import AdminFooterPage from "@/app/_admin/footer/page";
import AdminHelpPage from "@/app/_admin/help/page";
import AdminOrderDetailPage from "@/app/_admin/orders/[id]/page";
import AdminPackagesPage from "@/app/_admin/packages/page";
import AdminSettingsPage from "@/app/_admin/settings/page";
import AdminShippingPage from "@/app/_admin/shipping/page";
import AdminTicketsPage from "@/app/_admin/tickets/page";
import AdminUsersPage from "@/app/_admin/users/page";
import { adminMenu } from "@/config/admin-menu";
import { hasPermission } from "@/lib/auth/permissions";
import { requireAdmin } from "@/lib/admin-session";

type AdminProxyPageProps = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminProxyPage({ params, searchParams }: AdminProxyPageProps) {
  const user = await requireAdmin();
  const { slug } = await params;
  const route = slug.join("/");

  if (!canAccessRoute(user.role, route)) notFound();

  if (slug[0] === "orders" && slug[1]) return <AdminOrderDetailPage params={Promise.resolve({ id: slug[1] })} />;
  if (route === "diy-orders") return <AdminDiyOrdersPage />;
  if (route === "packages") return <AdminPackagesPage searchParams={searchParams} />;
  if (route === "users") return <AdminUsersPage />;
  if (route === "tickets") return <AdminTicketsPage />;
  if (route === "settings") return <AdminSettingsPage />;
  if (route === "finance") return <CatchAllAdminPage params={Promise.resolve({ slug: ["finance", "payments"] })} />;
  if (route === "shipping") return <AdminShippingPage />;
  if (route === "help") return <AdminHelpPage />;
  if (route === "footer") return <AdminFooterPage />;
  if (route === "auth") return <AdminAuthSettingsPage />;

  if (route === "product-cache") {
    return <CatchAllAdminPage params={Promise.resolve({ slug: ["products", "cache"] })} searchParams={searchParams} />;
  }
  if (route === "wallet") {
    return <CatchAllAdminPage params={Promise.resolve({ slug: ["finance", "wallet-transactions"] })} searchParams={searchParams} />;
  }
  if (route === "logs") {
    return <CatchAllAdminPage params={Promise.resolve({ slug: ["settings", "operation-logs"] })} searchParams={searchParams} />;
  }

  return <CatchAllAdminPage params={Promise.resolve({ slug })} searchParams={searchParams} />;
}

function canAccessRoute(userRole: string, route: string) {
  const path = `/admin/${route}`;
  const matchedItem = adminMenu.find((item) => item.path === path);
  if (matchedItem) return hasPermission(userRole, matchedItem.permission);

  for (const item of adminMenu) {
    const child = item.children?.find((candidate) => candidate.path === path);
    if (child) return hasPermission(userRole, child.permission);
  }

  if (route === "shipping") return hasPermission(userRole, "shipping_channels.manage");
  if (route === "settings") return hasPermission(userRole, "settings.manage");
  if (route === "auth") return hasPermission(userRole, "settings.manage");
  if (route === "help") return hasPermission(userRole, "help_articles.manage");
  if (route === "footer") return hasPermission(userRole, "footer.manage");
  if (route === "orders") return hasPermission(userRole, "orders.view");
  if (route === "finance") return hasPermission(userRole, "finance.view");

  return hasPermission(userRole, "dashboard.view");
}
