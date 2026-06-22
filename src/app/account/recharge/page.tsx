import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { AccountStatusBadge } from "@/components/account/AccountStatusBadge";
import { MobileRechargeRecords } from "@/components/account/mobile/MobileRechargeRecords";
import { MobileSectionShell } from "@/components/mobile/layout/MobileSectionShell";
import { WalletRechargePanel } from "@/components/wallet/WalletRechargePanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getTranslations } from "next-intl/server";
import { getOnlyPaySettings, onlyPayReady } from "@/modules/payment/onlypay";
import { getPayPalSettings, paypalReady, paypalSdkUrl } from "@/modules/payment/paypal";

export default async function AccountRechargePage() {
  const t = await getTranslations("account.recharge");
  const user = await getCurrentUser();
  const [rechargePayments, onlyPaySettings, paypalSettings] = await Promise.all([
    prisma.payment.findMany({
      where: { userId: user?.id, type: "wallet_recharge" },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    getOnlyPaySettings(),
    getPayPalSettings()
  ]);

  const methods = [
    {
      id: "onlypay" as const,
      title: onlyPaySettings.title || t("page.methods.onlypayTitle"),
      description: t("page.methods.onlypayDescription"),
      enabled: onlyPayReady(onlyPaySettings)
    },
    {
      id: "paypal" as const,
      title: paypalSettings.title || t("page.methods.paypalTitle"),
      description: paypalSettings.advancedCardEnabled ? t("page.methods.paypalAdvancedDescription") : t("page.methods.paypalDescription"),
      enabled: paypalReady(paypalSettings),
      sdkUrl: paypalSdkUrl(paypalSettings, paypalSettings.advancedCardEnabled ? ["buttons", "card-fields"] : ["buttons"]),
      advancedCardEnabled: paypalSettings.advancedCardEnabled
    },
    {
      id: "bank_transfer" as const,
      title: t("page.methods.bankTransferTitle"),
      description: t("page.methods.bankTransferDescription"),
      enabled: true
    }
  ].filter((method) => method.enabled);

  return (
    <>
      <MobileSectionShell title={t("page.title")} description={t("page.description")} kicker={t("page.title")} className="mobile-recharge-page md:hidden" minimalHeader showBackButton>
        <section className="card-stack-section">
          <WalletRechargePanel methods={methods} />
        </section>
        <section className="card-stack-section">
          <div className="mobile-order-card p-4">
            <MobileRechargeRecords
              title={t("page.records")}
              empty={t("page.empty")}
              searchPlaceholder={t("table.number")}
              filterLabel={t("table.status")}
              allLabel={t("table.status")}
              records={rechargePayments.map((record) => ({
                paymentNo: record.paymentNo,
                amount: Number(record.amount),
                currency: record.currency,
                status: record.status,
                method: translateRechargeMethod(record.paymentMethod || record.provider, t),
                createdAt: record.createdAt.toLocaleString()
              }))}
            />
          </div>
        </section>
      </MobileSectionShell>

      <div className="hidden space-y-6 md:block">
        <AccountPageHeader
          title={t("page.title")}
          description={t("page.description")}
        />

        <WalletRechargePanel methods={methods} />

        <Card className="border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <CardHeader>
            <CardTitle>{t("page.records")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.number")}</TableHead>
                  <TableHead>{t("table.amount")}</TableHead>
                  <TableHead>{t("table.method")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                  <TableHead>{t("table.created")}</TableHead>
                  <TableHead>{t("table.paid")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rechargePayments.length ? rechargePayments.map((record) => (
                  <TableRow key={record.paymentNo}>
                    <TableCell className="font-bold">{record.paymentNo}</TableCell>
                    <TableCell>${Number(record.amount).toFixed(2)} {record.currency}</TableCell>
                    <TableCell>{translateRechargeMethod(record.paymentMethod || record.provider, t)}</TableCell>
                    <TableCell><AccountStatusBadge status={record.status} /></TableCell>
                    <TableCell>{record.createdAt.toLocaleString()}</TableCell>
                    <TableCell>{record.paidAt ? record.paidAt.toLocaleString() : "-"}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-sm font-semibold text-slate-500">
                      {t("page.empty")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function translateRechargeMethod(
  value: string,
  t: Awaited<ReturnType<typeof getTranslations<"account.recharge">>>
) {
  const normalized = value.trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
  return t.has(`page.historyMethods.${normalized}`) ? t(`page.historyMethods.${normalized}`) : value;
}
