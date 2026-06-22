import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { AccountStatusBadge } from "@/components/account/AccountStatusBadge";
import { MobileDiyOrdersList } from "@/components/account/mobile/MobileDiyOrdersList";
import { MobileSectionShell } from "@/components/mobile/layout/MobileSectionShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { diyOrders } from "@/lib/account/mock-data";

export default async function AccountDiyOrdersPage() {
  const t = await getTranslations("account.diyOrders");

  return (
    <>
      <MobileSectionShell title={t("page.title")} description={t("page.description")} kicker={t("page.title")} className="mobile-diy-orders-page md:hidden" minimalHeader showBackButton>
        <section className="card-stack-section">
          <Link href="/account/diy-orders/new" className="cnsnap-home-mobile-more">
            {t("page.newOrder")}
          </Link>
        </section>
        <section className="card-stack-section">
          <MobileDiyOrdersList
            title={t("page.title")}
            searchPlaceholder={t("table.columns.diyNo")}
            allLabel="All"
            detailLabel={t("table.actions.viewDetails")}
            quantityLabel={t("table.columns.quantity")}
            budgetLabel={t("table.columns.budget")}
            quoteLabel={t("table.columns.quote")}
            rows={diyOrders.map((order) => ({
              id: order.id,
              diyNo: order.diyNo,
              productName: order.productName,
              productUrl: order.productUrl,
              quantity: order.quantity,
              budgetUsd: order.budgetUsd,
              quoteUsd: order.quoteUsd,
              status: order.status,
              createdAt: order.createdAt
            }))}
          />
        </section>
      </MobileSectionShell>

      <div className="hidden space-y-5 md:block">
        <AccountPageHeader
          title={t("page.title")}
          description={t("page.description")}
          action={<Button asChild><Link href="/account/diy-orders/new">{t("page.newOrder")}</Link></Button>}
        />
        <Card className="border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <CardContent className="p-0">
            <Table className="min-w-[920px]">
            <TableHeader>
              <TableRow className="bg-slate-50/70">
                <TableHead>{t("table.columns.diyNo")}</TableHead>
                <TableHead>{t("table.columns.product")}</TableHead>
                <TableHead>{t("table.columns.quantity")}</TableHead>
                <TableHead>{t("table.columns.budget")}</TableHead>
                <TableHead>{t("table.columns.quote")}</TableHead>
                <TableHead>{t("table.columns.status")}</TableHead>
                <TableHead>{t("table.columns.submitted")}</TableHead>
                <TableHead>{t("table.columns.action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {diyOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-black">{order.diyNo}</TableCell>
                  <TableCell>
                    <div className="font-bold text-slate-900">{order.productName}</div>
                    <a href={order.productUrl} target="_blank" rel="noreferrer" className="block max-w-[280px] truncate text-xs font-semibold text-sky-600">{order.productUrl}</a>
                  </TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>{order.budgetUsd ? `$${order.budgetUsd.toFixed(2)}` : "-"}</TableCell>
                  <TableCell>{order.quoteUsd ? `$${order.quoteUsd.toFixed(2)}` : "-"}</TableCell>
                  <TableCell><AccountStatusBadge status={order.status} /></TableCell>
                  <TableCell>{order.createdAt}</TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/account/diy-orders/${order.id}`}>{t("table.actions.viewDetails")}</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
