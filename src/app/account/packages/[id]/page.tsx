import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquareText, Truck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { AccountStatusBadge } from "@/components/account/AccountStatusBadge";
import { MobileSectionShell } from "@/components/mobile/layout/MobileSectionShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccountPackages } from "@/lib/account/packages";
import { mockPackages } from "@/lib/account/mock-data";

type AccountPackageDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AccountPackageDetailPage({ params, searchParams }: AccountPackageDetailPageProps) {
  const t = await getTranslations("account.packageDetail");
  const { id } = await params;
  const query = await searchParams;
  const paymentNotice = Array.isArray(query.payment) ? query.payment[0] : query.payment;
  const realPackages = await getAccountPackages();
  const pkg = realPackages.find((item) => item.id === id || item.packageNo === id) ?? mockPackages.find((item) => item.id === id || item.packageNo === id);
  if (!pkg) notFound();

  return (
    <>
      <MobileSectionShell title={pkg.packageNo} description={t("description")} kicker={t("overview.title")} className="mobile-package-detail-page md:hidden" minimalHeader showBackButton>
        {(paymentNotice === "paypal_paid" || paymentNotice === "balance_paid" || paymentNotice === "sepa_submitted") ? (
          <section className="card-stack-section">
            <div className="mobile-order-card p-4 text-sm font-bold text-emerald-700">
              {paymentNotice === "paypal_paid" ? t("payment.paypalPaid") : paymentNotice === "balance_paid" ? t("payment.balancePaid") : t("payment.sepaSubmitted")}
            </div>
          </section>
        ) : null}
        {pkg.shippingPaymentStatus === "pending" ? (
          <section className="card-stack-section">
            <div className="mobile-order-card p-4 text-sm font-bold leading-6 text-amber-900">
              {t("payment.pending")}
            </div>
          </section>
        ) : null}
        <section className="card-stack-section">
          <div className="mobile-order-card p-4">
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("overview.title")}</div>
            <div className="mobile-account-list">
              <MobilePackageInfo label={t("overview.packageNo")} value={pkg.packageNo} />
              <MobilePackageInfo label={t("overview.orderNo")} value={pkg.orderNo} />
              <MobilePackageInfo label={t("overview.status")} value={<AccountStatusBadge status={pkg.packageStatus} />} />
              <MobilePackageInfo label={t("overview.created")} value={pkg.createdAt} />
              <MobilePackageInfo label={t("overview.items")} value={pkg.itemCount} />
              <MobilePackageInfo label={t("overview.actualWeight")} value={`${pkg.actualWeightKg.toFixed(2)} kg`} />
              <MobilePackageInfo label={t("overview.dimensions")} value={pkg.dimensions} />
              <MobilePackageInfo label={t("overview.chargeableWeight")} value={`${pkg.chargeableWeightKg.toFixed(2)} kg`} />
              <MobilePackageInfo label={t("overview.destination")} value={pkg.destinationCountry} />
              <MobilePackageInfo label={t("overview.channel")} value={pkg.shippingChannel} />
              <MobilePackageInfo label={t("overview.shippingFee")} value={`$${pkg.shippingFeeUsd.toFixed(2)}`} />
              <MobilePackageInfo label={t("overview.tracking")} value={pkg.trackingNumber ?? "-"} />
            </div>
          </div>
        </section>
        <section className="card-stack-section">
          <div className="mobile-account-list">
            {pkg.shippingPaymentStatus === "pending" ? (
              <Link href={`/account/packages/${pkg.id}/pay`} className="mobile-orders-action is-primary">{t("payShippingFee")}</Link>
            ) : null}
            <Link href={`/account/tickets/new?packageId=${encodeURIComponent(pkg.id)}`} className="mobile-orders-action">{t("contactSupport")}</Link>
          </div>
        </section>
      </MobileSectionShell>

      <div className="hidden space-y-6 md:block">
        <AccountPageHeader
          title={pkg.packageNo}
          description={t("description")}
          action={
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline"><Link href="/account/packages"><ArrowLeft />{t("back")}</Link></Button>
              {pkg.shippingPaymentStatus === "pending" ? (
                <Button asChild>
                  <Link href={`/account/packages/${pkg.id}/pay`}>{t("payShippingFee")}</Link>
                </Button>
              ) : null}
              <Button asChild><Link href={`/account/tickets/new?packageId=${encodeURIComponent(pkg.id)}`}><MessageSquareText />{t("contactSupport")}</Link></Button>
            </div>
          }
        />
        {paymentNotice === "paypal_paid" ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {t("payment.paypalPaid")}
          </div>
        ) : paymentNotice === "balance_paid" ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {t("payment.balancePaid")}
          </div>
        ) : paymentNotice === "sepa_submitted" ? (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-700">
            {t("payment.sepaSubmitted")}
          </div>
        ) : null}
        {pkg.shippingPaymentStatus === "pending" ? (
          <div className="rounded-2xl border border-amber-300 bg-[linear-gradient(135deg,#fff7ed_0%,#fef3c7_100%)] px-4 py-3 text-sm font-bold leading-6 text-amber-900">
            {t("payment.pending")}
          </div>
        ) : null}
        <Card className="border-slate-200 bg-white/90">
          <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="size-5 text-sky-500" />{t("overview.title")}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Info label={t("overview.packageNo")} value={pkg.packageNo} />
            <Info label={t("overview.orderNo")} value={pkg.orderNo} />
            <Info label={t("overview.status")} value={<AccountStatusBadge status={pkg.packageStatus} />} />
            <Info label={t("overview.created")} value={pkg.createdAt} />
            <Info label={t("overview.items")} value={pkg.itemCount} />
            <Info label={t("overview.actualWeight")} value={`${pkg.actualWeightKg.toFixed(2)} kg`} />
            <Info label={t("overview.dimensions")} value={pkg.dimensions} />
            <Info label={t("overview.chargeableWeight")} value={`${pkg.chargeableWeightKg.toFixed(2)} kg`} />
            <Info label={t("overview.destination")} value={pkg.destinationCountry} />
            <Info label={t("overview.channel")} value={pkg.shippingChannel} />
            <Info label={t("overview.shippingFee")} value={`$${pkg.shippingFeeUsd.toFixed(2)}`} />
            <Info label={t("overview.tracking")} value={pkg.trackingNumber ?? "-"} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className="mt-1 font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function MobilePackageInfo({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3">
      <div className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className="text-sm font-black text-slate-950">{value}</div>
    </div>
  );
}
