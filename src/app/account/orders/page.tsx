import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { AccountOrdersTable } from "@/components/account/orders/AccountOrdersTable";
import { getAccountOrders } from "@/lib/account/orders";
import { getTranslations } from "next-intl/server";

export default async function AccountOrdersPage() {
  const t = await getTranslations("account.orders.page");
  const orders = await getAccountOrders();

  return (
    <div>
      <AccountPageHeader
        title={t("title")}
        description={t("description")}
        className="hidden md:flex"
      />
      <AccountOrdersTable data={orders.length ? orders : []} />
    </div>
  );
}
