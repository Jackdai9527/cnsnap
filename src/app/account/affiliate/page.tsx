import { AffiliateCopyButton } from "@/components/account/AffiliateCopyButton";
import { AccountMetricCard } from "@/components/account/AccountMetricCard";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { AccountStatusBadge } from "@/components/account/AccountStatusBadge";
import { MobileAffiliateRecords } from "@/components/account/mobile/MobileAffiliateRecords";
import { MobileSectionShell } from "@/components/mobile/layout/MobileSectionShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { commissionRecords, mockAccountUser } from "@/lib/account/mock-data";
import { getTranslations } from "next-intl/server";

export default async function AccountAffiliatePage() {
  const t = await getTranslations("account.affiliate");
  const referralLink = `http://localhost:3000/register?ref=${mockAccountUser.referralCode}`;
  const approved = commissionRecords.filter((record) => record.status === "approved").reduce((sum, record) => sum + record.commissionAmount, 0);
  const pending = commissionRecords.filter((record) => record.status === "pending").reduce((sum, record) => sum + record.commissionAmount, 0);
  const paid = commissionRecords.filter((record) => record.status === "paid").reduce((sum, record) => sum + record.commissionAmount, 0);

  return (
    <>
      <MobileSectionShell title={t("page.title")} description={t("page.description")} kicker={t("page.title")} className="mobile-affiliate-page md:hidden" minimalHeader showBackButton>
        <section className="card-stack-section">
          <div className="mobile-order-card p-4">
            <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("page.referralCode")}</div>
            <div className="mt-2 text-xl font-black text-slate-950">{mockAccountUser.referralCode}</div>
            <div className="mt-3 break-all rounded-2xl bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-700">{referralLink}</div>
            <div className="mt-4">
              <AffiliateCopyButton value={referralLink} />
            </div>
          </div>
        </section>
        <section className="card-stack-section">
          <div className="mobile-account-grid">
            <article className="mobile-account-shortcut p-4"><div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("page.referredUsers")}</div><div className="mt-2 text-xl font-black text-slate-950">3</div></article>
            <article className="mobile-account-shortcut p-4"><div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("page.validOrders")}</div><div className="mt-2 text-xl font-black text-slate-950">3</div></article>
            <article className="mobile-account-shortcut p-4"><div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("page.pendingCommission")}</div><div className="mt-2 text-xl font-black text-slate-950">${pending.toFixed(2)}</div></article>
            <article className="mobile-account-shortcut p-4"><div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("page.paidCommission")}</div><div className="mt-2 text-xl font-black text-slate-950">${paid.toFixed(2)}</div></article>
          </div>
        </section>
        <section className="card-stack-section">
          <MobileAffiliateRecords
            title={t("page.commissionRecords")}
            records={commissionRecords}
            orderAmountLabel={t("table.orderAmount")}
            rateLabel={t("table.rate")}
            commissionAmountLabel={t("table.commissionAmount")}
            allLabel="All"
            pendingLabel="Pending"
            approvedLabel="Approved"
            paidLabel="Paid"
          />
        </section>
      </MobileSectionShell>

      <div className="hidden space-y-6 md:block">
        <AccountPageHeader title={t("page.title")} description={t("page.description")} />
        <Card className="border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <CardHeader><CardTitle>{t("page.yourReferralLink")}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="grid gap-2">
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{t("page.referralCode")}</div>
              <div className="text-2xl font-black text-slate-950">{mockAccountUser.referralCode}</div>
              <div className="break-all rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-700">{referralLink}</div>
            </div>
            <AffiliateCopyButton value={referralLink} />
          </CardContent>
        </Card>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <AccountMetricCard title={t("page.referredUsers")} value={3} />
          <AccountMetricCard title={t("page.validOrders")} value={3} />
          <AccountMetricCard title={t("page.pendingCommission")} value={`$${pending.toFixed(2)}`} />
          <AccountMetricCard title={t("page.approvedCommission")} value={`$${approved.toFixed(2)}`} />
          <AccountMetricCard title={t("page.paidCommission")} value={`$${paid.toFixed(2)}`} />
        </section>

        <Card className="border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <CardHeader><CardTitle>{t("page.commissionRecords")}</CardTitle></CardHeader>
          <CardContent>
            <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.commissionNo")}</TableHead>
                <TableHead>{t("table.referredUser")}</TableHead>
                <TableHead>{t("table.order")}</TableHead>
                <TableHead>{t("table.orderAmount")}</TableHead>
                <TableHead>{t("table.rate")}</TableHead>
                <TableHead>{t("table.commissionAmount")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead>{t("table.created")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissionRecords.map((record) => (
                <TableRow key={record.commissionNo}>
                  <TableCell className="font-black">{record.commissionNo}</TableCell>
                  <TableCell>{record.referredUserEmail}</TableCell>
                  <TableCell>{record.orderNo}</TableCell>
                  <TableCell>${record.orderAmount.toFixed(2)}</TableCell>
                  <TableCell>{Math.round(record.commissionRate * 100)}%</TableCell>
                  <TableCell className="font-black text-emerald-700">${record.commissionAmount.toFixed(2)}</TableCell>
                  <TableCell><AccountStatusBadge status={record.status} /></TableCell>
                  <TableCell>{record.createdAt}</TableCell>
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
