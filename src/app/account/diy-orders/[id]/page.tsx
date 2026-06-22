import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { AccountStatusBadge } from "@/components/account/AccountStatusBadge";
import { MobileSectionShell } from "@/components/mobile/layout/MobileSectionShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { diyOrders } from "@/lib/account/mock-data";
import { money } from "@/lib/currency";

type AccountDiyOrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AccountDiyOrderDetailPage({ params }: AccountDiyOrderDetailPageProps) {
  const t = await getTranslations("account.diyOrders");
  const { id } = await params;
  const order = diyOrders.find((item) => item.id === id);
  if (!order) notFound();

  return (
    <>
      <MobileSectionShell title={order.diyNo} description={t("detail.description")} kicker={t("page.title")} className="mobile-diy-order-detail-page md:hidden" minimalHeader showBackButton>
        <section className="card-stack-section">
          <div className="mobile-order-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base font-black text-slate-950">{order.productName}</div>
                <div className="mt-1 text-xs font-semibold text-slate-500">{order.createdAt}</div>
              </div>
              <AccountStatusBadge status={order.status} />
            </div>
          </div>
        </section>

        <section className="card-stack-section">
          <div className="mobile-order-card p-4">
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("detail.overview")}</div>
            <div className="mobile-account-list">
              <MobileInfoRow label={t("table.columns.diyNo")} value={order.diyNo} />
              <MobileInfoRow label={t("table.columns.quantity")} value={String(order.quantity)} />
              <MobileInfoRow label={t("table.columns.budget")} value={order.budgetUsd ? money(order.budgetUsd) : "-"} />
              <MobileInfoRow label={t("table.columns.quote")} value={order.quoteUsd ? money(order.quoteUsd) : "-"} />
              <MobileInfoRow label={t("table.columns.status")} value={<AccountStatusBadge status={order.status} />} />
            </div>
          </div>
        </section>

        <section className="card-stack-section">
          <div className="mobile-order-card p-4">
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("detail.productLink")}</div>
            <a href={order.productUrl} target="_blank" rel="noreferrer" className="block break-all text-sm font-semibold text-sky-600">
              {order.productUrl}
            </a>
          </div>
        </section>

        <section className="card-stack-section">
          <div className="mobile-order-card p-4">
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("detail.remark")}</div>
            <p className="text-sm font-semibold leading-6 text-slate-600">{order.remark || t("detail.noRemark")}</p>
          </div>
        </section>
      </MobileSectionShell>

      <div className="hidden space-y-5 md:block">
        <AccountPageHeader
          title={order.diyNo}
          description={t("detail.description")}
          action={(
            <Button asChild variant="outline">
              <Link href={order.productUrl} target="_blank" rel="noreferrer">
                <ExternalLink />
                {t("detail.openProduct")}
              </Link>
            </Button>
          )}
        />

        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
          <Card className="border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <CardHeader>
              <CardTitle>{t("detail.overview")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Info label={t("table.columns.diyNo")} value={order.diyNo} />
              <Info label={t("table.columns.status")} value={<AccountStatusBadge status={order.status} />} />
              <Info label={t("table.columns.submitted")} value={order.createdAt} />
              <Info label={t("table.columns.quantity")} value={String(order.quantity)} />
              <Info label={t("table.columns.budget")} value={order.budgetUsd ? money(order.budgetUsd) : "-"} />
              <Info label={t("table.columns.quote")} value={order.quoteUsd ? money(order.quoteUsd) : "-"} />
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <CardHeader>
              <CardTitle>{t("detail.statusCard")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{t("table.columns.status")}</div>
                <div className="mt-2"><AccountStatusBadge status={order.status} /></div>
              </div>
              <p className="text-sm font-semibold leading-6 text-slate-600">{t("detail.statusHint")}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <CardHeader>
            <CardTitle>{t("table.columns.product")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-lg font-black text-slate-950">{order.productName}</div>
            <a href={order.productUrl} target="_blank" rel="noreferrer" className="block break-all text-sm font-semibold text-sky-600">
              {order.productUrl}
            </a>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{t("detail.remark")}</div>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{order.remark || t("detail.noRemark")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className="mt-2 break-words font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function MobileInfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3">
      <div className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className="text-sm font-black text-slate-950">{value}</div>
    </div>
  );
}
