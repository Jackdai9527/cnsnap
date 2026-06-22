import { getTranslations } from "next-intl/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { OrdersDataTable } from "@/app/admin/orders/OrdersDataTable";
import { filterableColumns } from "@/app/admin/orders/mock-data";
import { requirePermission } from "@/lib/admin-session";
import type { OrderTabKey } from "@/types/admin-orders";

type AdminOrdersPageProps = {
  searchParams?: Promise<{
    view?: string;
    orderStatus?: string;
    paymentStatus?: string;
    purchaseStatus?: string;
    warehouseStatus?: string;
    packageStatus?: string;
    shippingStatus?: string;
    riskStatus?: string;
    destinationCountry?: string;
    assignee?: string;
    created?: string;
    paidAt?: string;
    shippingPaymentStatus?: string;
    refundStatus?: string;
  }>;
};

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const user = await requirePermission("orders.view");
  const t = await getTranslations("legacy-admin.ordersListPage");
  const params = await searchParams;
  const initialView = params?.view === "trash" ? "trash" : "active";
  const initialFilters = {
    search: undefined,
    orderStatus: normalizeOrderTab(params?.orderStatus),
    paymentStatus: normalizeParam(params?.paymentStatus),
    purchaseStatus: normalizeParam(params?.purchaseStatus),
    warehouseStatus: normalizeParam(params?.warehouseStatus),
    packageStatus: normalizeParam(params?.packageStatus),
    shippingStatus: normalizeParam(params?.shippingStatus),
    shippingPaymentStatus: normalizeParam(params?.shippingPaymentStatus),
    riskStatus: normalizeParam(params?.riskStatus),
    refundStatus: normalizeParam(params?.refundStatus),
    destinationCountry: normalizeParam(params?.destinationCountry),
    assignee: normalizeParam(params?.assignee),
    created: normalizeParam(params?.created),
    paidAt: normalizeParam(params?.paidAt)
  };

  return (
    <section className="space-y-5">
      <AdminPageHeader
        title={t("title")}
        description={initialView === "trash"
          ? t("trashDescription")
          : t("activeDescription")}
      />
      <OrdersDataTable initialData={[]} filterableColumns={filterableColumns} userRole={user.role} initialView={initialView} initialFilters={initialFilters} />
    </section>
  );
}

function normalizeParam(value?: string) {
  if (!value || value === "all") return undefined;
  return value;
}

function normalizeOrderTab(value?: string): OrderTabKey | undefined {
  const allowed: OrderTabKey[] = [
    "all",
    "pending_payment",
    "paid",
    "reviewing",
    "purchasing",
    "warehouse_pending",
    "shipping_pending",
    "shipped",
    "completed",
    "cancelled",
    "refunded"
  ];

  return value && allowed.includes(value as OrderTabKey) ? (value as OrderTabKey) : undefined;
}
