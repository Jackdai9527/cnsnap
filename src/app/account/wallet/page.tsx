import { AccountMetricCard } from "@/components/account/AccountMetricCard";
import { MobileWalletList } from "@/components/account/mobile/MobileWalletList";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { MobileSectionShell } from "@/components/mobile/layout/MobileSectionShell";
import { WalletTransactionsTable } from "@/components/account/wallet/WalletTransactionsTable";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";

type AccountWalletPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AccountWalletPage({ searchParams }: AccountWalletPageProps) {
  const t = await getTranslations("account.wallet");
  const params = searchParams ? await searchParams : {};
  const paymentNotice = Array.isArray(params.payment) ? params.payment[0] : params.payment;
  const user = await getCurrentUser();

  const transactions = await prisma.walletTransaction.findMany({
    where: { userId: user?.id },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  const totalRecharge = transactions.filter((item) => item.type === "recharge").reduce((sum, item) => sum + Number(item.amount), 0);
  const totalSpend = Math.abs(transactions.filter((item) => Number(item.amount) < 0).reduce((sum, item) => sum + Number(item.amount), 0));
  const totalRefund = transactions.filter((item) => item.type === "refund").reduce((sum, item) => sum + Number(item.amount), 0);

  const tableData = transactions.map((item) => ({
    transactionNo: `WTX-${item.id}`,
    type: item.type as "recharge" | "pay_order" | "pay_shipping" | "refund" | "adjustment" | "commission",
    amount: Number(item.amount),
    currency: item.currency as "USD",
    balanceAfter: Number(item.balanceAfter),
    relatedOrderNo: item.relatedOrderId ? String(item.relatedOrderId) : undefined,
    relatedPackageNo: item.relatedPackageId ? String(item.relatedPackageId) : undefined,
    note: item.note || "",
    createdAt: item.createdAt.toLocaleString()
  }));

  const mobileFilterOptions = [
    { label: t("table.filters.allTypes"), value: "all" },
    { label: t("table.filters.recharge"), value: "recharge" },
    { label: t("table.filters.payOrder"), value: "pay_order" },
    { label: t("table.filters.payShipping"), value: "pay_shipping" },
    { label: t("table.filters.refund"), value: "refund" },
    { label: t("table.filters.adjustment"), value: "adjustment" },
    { label: t("table.filters.commission"), value: "commission" }
  ];

  return (
    <>
      <MobileSectionShell title={t("page.title")} description={t("page.description")} kicker={t("page.title")} className="mobile-wallet-page md:hidden" minimalHeader showBackButton>
        {(paymentNotice === "paypal_paid" || paymentNotice === "balance_paid") ? (
          <section className="card-stack-section">
            <div className="mobile-account-card p-4 text-sm font-bold text-emerald-700">
              {paymentNotice === "paypal_paid" ? t("page.rechargeSuccess") : t("page.balancePaymentSuccess")}
            </div>
          </section>
        ) : null}

        <section className="card-stack-section">
          <div className="mobile-account-grid">
            <article className="mobile-account-shortcut p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("metrics.currentBalance")}</div>
              <div className="mt-2 text-xl font-black text-slate-950">${Number(user?.walletBalance ?? 0).toFixed(2)}</div>
            </article>
            <article className="mobile-account-shortcut p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("metrics.frozenAmount")}</div>
              <div className="mt-2 text-xl font-black text-slate-950">$0.00</div>
            </article>
            <article className="mobile-account-shortcut p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("metrics.totalRecharge")}</div>
              <div className="mt-2 text-xl font-black text-slate-950">${totalRecharge.toFixed(2)}</div>
            </article>
            <article className="mobile-account-shortcut p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("metrics.totalSpend")}</div>
              <div className="mt-2 text-xl font-black text-slate-950">${totalSpend.toFixed(2)}</div>
            </article>
          </div>
        </section>

        <section className="card-stack-section">
          <div className="mobile-order-card p-4">
            <MobileWalletList
              tableData={tableData}
              title={t("page.title")}
              description={t("page.description")}
              searchPlaceholder={t("table.columns.transaction")}
              filterAriaLabel={t("table.columns.type")}
              filterOptions={mobileFilterOptions}
              emptyTitle={t("table.empty")}
            />
          </div>
        </section>
      </MobileSectionShell>

      <div className="hidden space-y-6 md:block">
        <AccountPageHeader title={t("page.title")} description={t("page.description")} />

        {paymentNotice === "paypal_paid" ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {t("page.rechargeSuccess")}
          </div>
        ) : paymentNotice === "balance_paid" ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {t("page.balancePaymentSuccess")}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <AccountMetricCard title={t("metrics.currentBalance")} value={`$${Number(user?.walletBalance ?? 0).toFixed(2)}`} />
          <AccountMetricCard title={t("metrics.frozenAmount")} value="$0.00" description={t("metrics.frozenDescription")} />
          <AccountMetricCard title={t("metrics.totalRecharge")} value={`$${totalRecharge.toFixed(2)}`} />
          <AccountMetricCard title={t("metrics.totalSpend")} value={`$${totalSpend.toFixed(2)}`} />
          <AccountMetricCard title={t("metrics.totalRefund")} value={`$${totalRefund.toFixed(2)}`} />
        </section>

        <WalletTransactionsTable data={tableData} />
      </div>
    </>
  );
}
