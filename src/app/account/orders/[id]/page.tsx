import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquareText, PackageCheck, WalletCards } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { confirmOrderQcAndContinue } from "@/app/user/actions";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { AccountStatusBadge } from "@/components/account/AccountStatusBadge";
import { CancelOrderButton } from "@/components/account/orders/CancelOrderButton";
import { ReorderButton } from "@/components/account/orders/ReorderButton";
import { MobileSectionShell } from "@/components/mobile/layout/MobileSectionShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { canCustomerCancelOrder, cancelOrderIfEligible, getAutoCancelDeadline } from "@/lib/account/order-cancellation";
import { countryName } from "@/lib/countries";
import { money } from "@/lib/currency";
import { prisma } from "@/lib/db";
import { buildOrderFeeSnapshot } from "@/lib/order-fee-snapshot";
import {
  findMockOrder,
  inferMockOrderPlatform,
  inferMockOrderSourceItemId,
  mockPackages
} from "@/lib/account/mock-data";
import { getCurrentUser } from "@/lib/session";

type AccountOrderDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type AccountViewOrder = {
  id: string;
  orderNo: string;
  createdAt: string;
  orderSource: string;
  items: Array<{
    id: string;
    productId?: number | null;
    title: string;
    sku: string;
    quantity: number;
    priceUsd: number;
    priceCny: number;
    image: string;
    sourceUrl: string;
    platform: string;
  }>;
  totalUsd: number;
  subtotalCny: number;
  serviceFeeUsd: number;
  domesticShippingUsd: number;
  valueAddedServicesUsd: number;
  valueAddedServices: OrderValueAddedServiceSnapshot[];
  estimatedShippingUsd: number;
  actualShippingUsd: number;
  paidUsd: number;
  unpaidUsd: number;
  paymentStatus: string;
  purchaseStatus: string;
  warehouseStatus: string;
  packageStatus: string;
  shippingPaymentStatus: string;
  shippingStatus: string;
  status: string;
  destinationCountry: string;
  address: {
    name: string;
    phone: string;
    email: string;
    country: string;
    state: string;
    city: string;
    postalCode: string;
    line1: string;
    line2?: string;
  };
  packages: Array<{ id: string; packageNo: string }>;
  payments: Array<{ paymentNo: string; method: string; amountUsd: number; status: string; createdAt: string }>;
  qcPhotos: Array<{ id: string; url: string; altText?: string; originalName: string; createdAt?: string }>;
  timeline: Array<{ title: string; description: string; status: "done" | "current" | "pending"; time?: string }>;
  userNote?: string;
  paymentHref?: string;
  canCancel?: boolean;
  autoCancelAt?: string;
};

export default async function AccountOrderDetailPage({ params, searchParams }: AccountOrderDetailPageProps) {
  const t = await getTranslations("account.orderDetail");
  const sourceT = await getTranslations("account.orderSources");
  const statusT = await getTranslations("account.statuses");
  const { id } = await params;
  const query = await searchParams;
  const paymentNotice = Array.isArray(query.payment) ? query.payment[0] : query.payment;
  const cancelNotice = Array.isArray(query.cancel) ? query.cancel[0] : query.cancel;

  const order = await resolveAccountOrder(id, t, statusT);
  if (!order) notFound();

  const itemTotalUsd = order.items.reduce((sum, item) => sum + item.priceUsd * item.quantity, 0);
  const feeSnapshot = buildOrderFeeSnapshot({
    subtotalUsd: itemTotalUsd,
    subtotalCny: order.subtotalCny,
    domesticShippingUsd: order.domesticShippingUsd,
    serviceFeeUsd: order.serviceFeeUsd,
    valueAddedServicesUsd: order.valueAddedServicesUsd,
    paidUsd: order.paidUsd,
    unpaidUsd: order.unpaidUsd,
    totalUsd: order.totalUsd
  });
  const nextStep = nextStepNotice(order, t);
  const shippingPaymentHref = order.packages[0] ? `/account/packages/${order.packages[0].id}/pay` : undefined;
  const canPayShipping =
    !!shippingPaymentHref
    && (
      order.shippingPaymentStatus === "pending"
      || order.packageStatus === "waiting_shipping_payment"
      || order.status === "waiting_shipping_payment"
      || order.status === "international_freight_pending"
    );
  const canConfirmQcAndPay = canPayShipping && order.qcPhotos.length > 0;
  const reorderItems = order.items.map((item) => ({
    productId: item.productId ?? null,
    platform: item.platform,
    sourceItemId: inferMockOrderSourceItemId(item.sourceUrl, item.id),
    title: item.title,
    image: item.image,
    priceCny: item.priceCny,
    priceUsd: item.priceUsd,
    skuText: item.sku,
    quantity: item.quantity
  }));

  return (
    <>
      <MobileSectionShell title={order.orderNo} description={t("description")} kicker={t("cards.orderOverview")} className="mobile-order-detail-page md:hidden" minimalHeader showBackButton>
        <section className="card-stack-section">
          <div className="mobile-order-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("fields.status")}</div>
                <div className="mt-2"><AccountStatusBadge status={order.status} /></div>
                <div className="mt-3 text-xs font-semibold text-slate-500">{order.createdAt}</div>
              </div>
              {order.unpaidUsd > 0 ? (
                <div className="rounded-full bg-[#fff1f2] px-3 py-1 text-xs font-black text-[#d9142f]">
                  {money(order.unpaidUsd)}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {nextStep ? (
          <section className="card-stack-section">
            <div className="mobile-order-card p-4">
              <div className={`text-[11px] font-black uppercase tracking-[0.12em] ${nextStep.tone === "warning" ? "text-amber-700" : nextStep.tone === "success" ? "text-emerald-700" : "text-sky-700"}`}>
                {t("nextStep.eyebrow")}
              </div>
              <div className="mt-2 text-base font-black text-slate-950">{nextStep.title}</div>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{nextStep.description}</p>
              {nextStep.actionLabel && nextStep.actionHref ? (
                <Link href={nextStep.actionHref} className="mobile-orders-action is-primary mt-4">
                  {nextStep.actionLabel}
                </Link>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="card-stack-section">
          <div className="mobile-order-card p-4">
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("cards.timeline")}</div>
            <div className="mobile-order-timeline">
              {order.timeline.length ? order.timeline.map((entry, index) => (
                <div key={`${entry.title}-${index}`} className="mobile-order-timeline-item">
                  <span className={`mobile-order-timeline-dot ${entry.status}`}></span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-black text-slate-950">{entry.title}</div>
                      <span className={timelineTone(entry.status)}>{labelizeTimelineStatus(entry.status, t)}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{entry.description}</p>
                    {entry.time ? <div className="mt-2 text-xs font-semibold text-slate-400">{entry.time}</div> : null}
                  </div>
                </div>
              )) : <p className="text-sm text-slate-500">{t("states.noTimeline")}</p>}
            </div>
          </div>
        </section>

        <section className="card-stack-section">
          <div className="mobile-orders-list">
            {order.items.map((item) => (
              <article key={item.id} className="mobile-order-card p-4">
                <div className="flex gap-3">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                    <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-black text-slate-950">{item.title}</div>
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                        {item.platform}
                      </span>
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">{item.sku}</div>
                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{t("fields.quantity")}</div>
                        <div className="mt-1 text-sm font-black text-slate-950">{item.quantity}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{t("fields.unitPrice")}</div>
                        <div className="mt-1 text-sm font-black text-slate-950">{money(item.priceUsd)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{t("fields.lineTotal")}</div>
                        <div className="mt-1 text-sm font-black text-slate-950">{money(item.priceUsd * item.quantity)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="card-stack-section">
          <div className="mobile-order-card p-4">
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("cards.paymentSummary")}</div>
            <div className="mobile-account-list">
              <MobileInfoRow label={t("fields.itemsTotal")} value={money(feeSnapshot.itemsSubtotalUsd)} />
              <MobileInfoRow label={t("fields.serviceFee")} value={money(feeSnapshot.serviceFeeUsd)} />
              <MobileInfoRow label={t("fields.chinaShipping")} value={money(feeSnapshot.domesticShippingUsd)} />
              <MobileInfoRow label={t("fields.valueAddedServices")} value={money(feeSnapshot.valueAddedServicesUsd)} />
              {order.valueAddedServices.length ? (
                <div className="rounded-2xl bg-slate-50 px-3 py-3">
                  <div className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{t("fields.valueAddedServiceDetails")}</div>
                  <div className="mt-3 space-y-2">
                    {order.valueAddedServices.map((service) => (
                      <div key={`${service.serviceId}-${service.code}`} className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-black text-slate-950">{service.name}</div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">
                            {service.chargeStandard} x {service.quantity}
                          </div>
                          {service.note ? <div className="mt-1 text-xs font-semibold text-slate-500">{service.note}</div> : null}
                        </div>
                        <div className="shrink-0 text-sm font-black text-slate-950">{money(service.subtotalUsd)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <MobileInfoRow label={t("fields.paid")} value={money(feeSnapshot.paidUsd)} />
              <MobileInfoRow label={t("fields.amountDue")} value={money(feeSnapshot.unpaidUsd)} emphasis />
              <MobileInfoRow label={t("fields.orderTotal")} value={money(feeSnapshot.orderTotalUsd)} />
            </div>
          </div>
        </section>

        <section className="card-stack-section">
          <div className="mobile-order-card p-4">
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("cards.shippingAddress")}</div>
            <div className="mobile-account-list">
              <MobileInfoRow label={t("fields.name")} value={order.address.name || "-"} />
              <MobileInfoRow label={t("fields.phone")} value={order.address.phone || "-"} />
              <MobileInfoRow label={t("fields.email")} value={order.address.email || "-"} />
              <MobileInfoRow label={t("fields.address")} value={`${order.address.line1}${order.address.line2 ? `, ${order.address.line2}` : ""}` || "-"} />
              <MobileInfoRow label={t("fields.city")} value={`${order.address.city}${order.address.state ? `, ${order.address.state}` : ""} ${order.address.postalCode}`.trim() || "-"} />
              <MobileInfoRow label={t("fields.country")} value={displayCountry(order.address.country)} />
            </div>
          </div>
        </section>

        <section className="card-stack-section">
          <div className="mobile-order-card p-4">
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("cards.packageInformation")}</div>
            <div className="mobile-account-list">
              {order.packages.length ? order.packages.map((pkg) => (
                <Link key={pkg.id} href={`/account/packages/${pkg.id}`} className="mobile-account-card flex items-center justify-between gap-3 p-4">
                  <span className="text-sm font-black text-slate-950">{pkg.packageNo}</span>
                  <PackageCheck className="size-4 text-slate-400" />
                </Link>
              )) : <p className="text-sm text-slate-500">{t("states.noPackages")}</p>}
            </div>
          </div>
        </section>

        <section className="card-stack-section">
          <div className="mobile-order-card p-4">
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("cards.paymentRecords")}</div>
            <div className="mobile-account-list">
              {order.payments.length ? order.payments.map((payment) => (
                <div key={payment.paymentNo} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-black text-slate-950">{payment.paymentNo}</div>
                    <AccountStatusBadge status={payment.status} />
                  </div>
                  <div className="mt-3 grid gap-2">
                    <MobileInfoRow label={t("fields.method")} value={payment.method} />
                    <MobileInfoRow label={t("fields.amount")} value={money(payment.amountUsd)} />
                    <MobileInfoRow label={t("fields.created")} value={payment.createdAt} />
                  </div>
                </div>
              )) : <p className="text-sm text-slate-500">{t("states.noPayments")}</p>}
            </div>
          </div>
        </section>

        <section className="card-stack-section">
          <div className="mobile-account-list">
            {canConfirmQcAndPay ? (
              <form action={confirmOrderQcAndContinue}>
                <input type="hidden" name="orderId" value={order.id} />
                <button type="submit" className="mobile-orders-action is-primary w-full">
                  {t("confirmQcAndPayShipping")}
                </button>
              </form>
            ) : null}
            {order.unpaidUsd > 0 && order.paymentHref ? (
              <Link href={order.paymentHref} className="mobile-orders-action is-primary">
                {t("payNow")}
              </Link>
            ) : null}
            {order.canCancel ? <CancelOrderButton orderId={order.id} compact /> : null}
            {canPayShipping ? (
              <Link href={shippingPaymentHref} className="mobile-orders-action is-primary">
                {t("payShippingFee")}
              </Link>
            ) : null}
            <Link href={`/account/tickets/new?orderId=${encodeURIComponent(order.id)}`} className="mobile-orders-action">
              {t("contactSupport")}
            </Link>
          </div>
        </section>
      </MobileSectionShell>

      <div className="hidden space-y-6 md:block">
        <AccountPageHeader
          title={order.orderNo}
          description={t("description")}
          action={
            <div className="flex flex-wrap gap-2">
              {canConfirmQcAndPay ? (
                <form action={confirmOrderQcAndContinue}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <Button type="submit">
                    <WalletCards />
                    {t("confirmQcAndPayShipping")}
                  </Button>
                </form>
              ) : null}
              {canPayShipping ? (
                <Button asChild>
                  <Link href={shippingPaymentHref}>
                    <WalletCards />
                    {t("payShippingFee")}
                  </Link>
                </Button>
              ) : null}
              {order.unpaidUsd > 0 && order.paymentHref ? (
                <Button asChild>
                  <Link href={order.paymentHref}>
                    <WalletCards />
                    {t("payNow")}
                  </Link>
                </Button>
              ) : null}
              {order.canCancel ? <CancelOrderButton orderId={order.id} /> : null}
              <Button asChild variant="outline">
                <Link href={`/account/tickets/new?orderId=${encodeURIComponent(order.id)}`}>
                  <MessageSquareText />
                  {t("contactSupport")}
                </Link>
              </Button>
            </div>
          }
        />

      {cancelNotice === "success" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {t("payment.cancelled")}
        </div>
      ) : paymentNotice === "paypal_paid" ? (
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

      {nextStep ? (
        <div className={`rounded-2xl border px-4 py-4 ${nextStep.tone === "warning" ? "border-amber-200 bg-amber-50" : nextStep.tone === "success" ? "border-emerald-200 bg-emerald-50" : "border-sky-200 bg-sky-50"}`}>
          <div className={`text-xs font-black uppercase tracking-[0.12em] ${nextStep.tone === "warning" ? "text-amber-700" : nextStep.tone === "success" ? "text-emerald-700" : "text-sky-700"}`}>
            {t("nextStep.eyebrow")}
          </div>
          <div className="mt-2 text-base font-black text-slate-950">{nextStep.title}</div>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{nextStep.description}</p>
          {nextStep.actionLabel && nextStep.actionHref ? (
            <div className="mt-4">
              <Button asChild size="sm">
                <Link href={nextStep.actionHref}>
                  <WalletCards />
                  {nextStep.actionLabel}
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-slate-200 bg-white/90">
          <CardHeader>
            <CardTitle>{t("cards.orderOverview")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Info label={t("fields.orderNo")} value={order.orderNo} />
            <Info label={t("fields.status")} value={<AccountStatusBadge status={order.status} />} />
            <Info label={t("fields.created")} value={order.createdAt} />
            <Info label={t("fields.source")} value={labelizeSource(order.orderSource, sourceT)} />
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/90">
          <CardHeader>
            <CardTitle>{t("cards.actions")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {canConfirmQcAndPay ? (
              <form action={confirmOrderQcAndContinue}>
                <input type="hidden" name="orderId" value={order.id} />
                <Button type="submit" className="w-full">
                  <WalletCards />
                  {t("confirmQcAndPayShipping")}
                </Button>
              </form>
            ) : null}
            {canPayShipping ? (
              <Button asChild>
                <Link href={shippingPaymentHref}>
                  <WalletCards />
                  {t("payShippingFee")}
                </Link>
              </Button>
            ) : null}
            {order.packages[0] ? (
              <Button asChild variant="outline">
                <Link href={`/account/packages/${order.packages[0].id}`}>
                  <PackageCheck />
                  {t("cards.packageInformation")}
                </Link>
              </Button>
            ) : null}
            <ReorderButton items={reorderItems} />
            <Button asChild variant="outline">
              <Link href={`/account/tickets/new?orderId=${encodeURIComponent(order.id)}`}>
                <MessageSquareText />
                {t("contactSupport")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-5">
        <Card className="border-slate-200 bg-white/90">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle>{t("cards.productItems")}</CardTitle>
              <p className="mt-2 text-sm leading-6 text-slate-500">{t("cards.productItemsDescription")}</p>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              {t("states.itemsCount", { count: order.items.length, suffix: order.items.length > 1 ? "s" : "" })}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="grid gap-4 rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)] md:grid-cols-[108px_minmax(0,1fr)_180px] md:items-start">
                <div className="relative size-24 overflow-hidden rounded-2xl bg-slate-100 md:size-[108px]">
                  <Image src={item.image} alt={item.title} fill sizes="108px" className="object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-black text-slate-950">{item.title}</h2>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
                      {item.platform}
                    </span>
                  </div>
                  <p className="mt-2 break-words text-sm font-medium text-slate-500">{item.sku}</p>
                  <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex max-w-full break-all rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700">
                    {item.sourceUrl}
                  </a>
                </div>
                    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold tabular-nums text-slate-700 md:text-right">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("fields.quantity")}</div>
                    <div className="mt-1 text-base text-slate-950">{item.quantity}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("fields.unitPrice")}</div>
                    <div className="mt-1 text-base text-slate-950">{money(item.priceUsd)}</div>
                    <div className="text-xs text-slate-400">CN ￥{item.priceCny.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("fields.lineTotal")}</div>
                    <div className="mt-1 text-lg text-slate-950">{money(item.priceUsd * item.quantity)}</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <Card className="border-slate-200 bg-white/90">
              <CardHeader>
                <CardTitle>{t("cards.paymentSummary")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                <MoneyLine label={t("fields.itemsTotal")} usd={itemTotalUsd} cny={order.subtotalCny} />
                {order.serviceFeeUsd > 0 ? <MoneyLine label={t("fields.serviceFee")} usd={order.serviceFeeUsd} /> : null}
                <MoneyLine label={t("fields.chinaShipping")} usd={order.domesticShippingUsd} />
                <MoneyLine label={t("fields.valueAddedServices")} usd={order.valueAddedServicesUsd} />
                <MoneyLine label={t("fields.paid")} usd={order.paidUsd} positive={order.paidUsd > 0} />
                <MoneyLine label={t("fields.amountDue")} usd={order.unpaidUsd} warning={order.unpaidUsd > 0} />
                <MoneyLine label={t("fields.orderTotal")} usd={order.totalUsd} />
              </CardContent>
              {order.valueAddedServices.length ? (
                <CardContent className="pt-0">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{t("fields.valueAddedServiceDetails")}</div>
                    <div className="mt-3 space-y-3">
                      {order.valueAddedServices.map((service) => (
                        <div key={`${service.serviceId}-${service.code}`} className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="font-black text-slate-950">{service.name}</div>
                            <div className="mt-1 text-xs font-semibold text-slate-500">
                              {service.chargeStandard} x {service.quantity}
                            </div>
                            {service.note ? <div className="mt-1 text-xs font-semibold text-slate-500">{service.note}</div> : null}
                          </div>
                          <div className="shrink-0 text-sm font-black text-slate-950">{money(service.subtotalUsd)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              ) : null}
            </Card>

            <Card className="border-slate-200 bg-white/90">
              <CardHeader><CardTitle>{t("cards.fulfillmentSnapshot")}</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Info label={t("fields.orderStatus")} value={<AccountStatusBadge status={order.status} />} />
                <Info label={t("fields.paymentStatus")} value={<AccountStatusBadge status={order.paymentStatus} />} />
                <Info label={t("fields.purchaseStatus")} value={<AccountStatusBadge status={order.purchaseStatus} />} />
                <Info label={t("fields.warehouseStatus")} value={<AccountStatusBadge status={order.warehouseStatus} />} />
                <Info label={t("fields.packageStatus")} value={<AccountStatusBadge status={order.packageStatus} />} />
                <Info label={t("fields.shippingStatus")} value={<AccountStatusBadge status={order.shippingStatus} />} />
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white/90">
              <CardHeader><CardTitle>{t("cards.timeline")}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {order.timeline.length ? order.timeline.map((entry, index) => (
                  <div key={`${entry.title}-${index}`} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-black text-slate-950">{entry.title}</div>
                      <span className={timelineTone(entry.status)}>{labelizeTimelineStatus(entry.status, t)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{entry.description}</p>
                    {entry.time ? <div className="mt-2 text-xs font-semibold text-slate-400">{entry.time}</div> : null}
                  </div>
                )) : <p className="text-sm text-slate-500">{t("states.noTimeline")}</p>}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card className="border-slate-200 bg-white/90">
              <CardHeader><CardTitle>{t("cards.shippingAddress")}</CardTitle></CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <Info label={t("fields.name")} value={order.address.name || "-"} />
                <Info label={t("fields.email")} value={order.address.email || "-"} />
                <Info label={t("fields.phone")} value={order.address.phone || "-"} />
                <Info label={t("fields.address")} value={`${order.address.line1}${order.address.line2 ? `, ${order.address.line2}` : ""}` || "-"} />
                <Info label={t("fields.city")} value={`${order.address.city}${order.address.state ? `, ${order.address.state}` : ""} ${order.address.postalCode}`.trim() || "-"} />
                <Info label={t("fields.country")} value={displayCountry(order.address.country)} />
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white/90">
              <CardHeader><CardTitle>{t("cards.qcPhotos")}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {order.qcPhotos.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {order.qcPhotos.map((photo) => (
                      <a
                        key={photo.id}
                        href={photo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-sky-200 hover:shadow-md"
                      >
                        <div className="relative aspect-[4/3] bg-slate-100">
                          <Image src={photo.url} alt={photo.altText || photo.originalName} fill sizes="(min-width: 1280px) 280px, (min-width: 640px) 45vw, 100vw" className="object-cover" />
                        </div>
                        <div className="space-y-1 p-3">
                          <div className="truncate text-sm font-black text-slate-900">{photo.originalName}</div>
                          <div className="text-xs font-semibold text-slate-500">{photo.createdAt || t("states.qcPhotoAvailable")}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">{t("states.noQcPhotos")}</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white/90">
              <CardHeader><CardTitle>{t("cards.userNote")}</CardTitle></CardHeader>
              <CardContent className="text-sm leading-6 text-slate-600">{order.userNote || t("states.noNote")}</CardContent>
            </Card>

            <Card className="border-slate-200 bg-white/90">
              <CardHeader><CardTitle>{t("cards.paymentRecords")}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {order.payments.length ? order.payments.map((payment) => (
                  <div key={payment.paymentNo} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-black text-slate-950">{payment.paymentNo}</div>
                      <AccountStatusBadge status={payment.status} />
                    </div>
                    <Separator className="my-3" />
                    <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                      <Info label={t("fields.method")} value={payment.method} />
                      <Info label={t("fields.amount")} value={money(payment.amountUsd)} />
                      <Info label={t("fields.created")} value={payment.createdAt} />
                    </div>
                  </div>
                )) : <p className="text-sm text-slate-500">{t("states.noPayments")}</p>}
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white/90">
              <CardHeader><CardTitle>{t("cards.packageInformation")}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {order.packages.length ? order.packages.map((pkg) => (
                  <Link key={pkg.id} href={`/account/packages/${pkg.id}`} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:border-sky-200 hover:text-sky-700">
                    {pkg.packageNo}
                    <PackageCheck className="size-4" />
                  </Link>
                )) : <p className="text-sm text-slate-500">{t("states.noPackages")}</p>}
              </CardContent>
            </Card>
          </div>
        </section>
      </section>
      </div>
    </>
  );
}

async function resolveAccountOrder(
  id: string,
  t: Awaited<ReturnType<typeof getTranslations<"account.orderDetail">>>,
  statusT: Awaited<ReturnType<typeof getTranslations<"account.statuses">>>
): Promise<AccountViewOrder | null> {
  const mockOrder = findMockOrder(id);
  if (mockOrder) {
    const relatedPackages = mockOrder.packages
      .map((packageId) => mockPackages.find((pkg) => pkg.id === packageId || pkg.packageNo === packageId))
      .filter((pkg) => pkg !== undefined)
      .map((pkg) => ({ id: pkg.id, packageNo: pkg.packageNo }));

    return {
      id: mockOrder.id,
      orderNo: mockOrder.orderNo,
      createdAt: mockOrder.createdAt,
      orderSource: mockOrder.orderSource,
      items: mockOrder.items.map((item) => ({
        id: item.id,
        productId: null,
        title: item.title,
        sku: item.sku,
        quantity: item.quantity,
        priceUsd: item.priceUsd,
        priceCny: item.priceCny,
        image: item.image,
        sourceUrl: item.sourceUrl,
        platform: inferMockOrderPlatform(item.sourceUrl)
      })),
      totalUsd: mockOrder.totalUsd,
      subtotalCny: mockOrder.subtotalCny,
      serviceFeeUsd: mockOrder.serviceFeeUsd,
      domesticShippingUsd: mockOrder.domesticShippingUsd,
      valueAddedServicesUsd: 0,
      valueAddedServices: [],
      estimatedShippingUsd: mockOrder.estimatedShippingUsd,
      actualShippingUsd: mockOrder.actualShippingUsd,
      paidUsd: mockOrder.paidUsd,
      unpaidUsd: mockOrder.unpaidUsd,
      paymentStatus: mockOrder.paymentStatus,
      purchaseStatus: mockOrder.purchaseStatus,
      warehouseStatus: mockOrder.warehouseStatus,
      packageStatus: mockOrder.packageStatus,
      shippingPaymentStatus: mockOrder.status === "waiting_shipping_payment" ? "pending" : ["shipped", "delivered"].includes(mockOrder.packageStatus) ? "paid" : "none",
      shippingStatus: mockOrder.shippingStatus,
      status: mockOrder.status,
      destinationCountry: mockOrder.destinationCountry,
      address: mockOrder.address,
      packages: relatedPackages,
      payments: mockOrder.payments,
      qcPhotos: mockOrder.qcPhotos ?? [],
      timeline: mockOrder.timeline,
      userNote: mockOrder.userNote,
      paymentHref: `/account/orders/${mockOrder.id}/pay`,
      canCancel: false
    };
  }

  const user = await getCurrentUser();
  if (!user) return null;

  const order = await prisma.order.findFirst({
    where: { id: Number(id), userId: user.id },
    include: {
      address: true,
      items: true,
      logs: { orderBy: { createdAt: "desc" } },
      packages: true,
      payments: { orderBy: { createdAt: "desc" } },
      mediaAssets: { where: { usage: "qc_photo" }, orderBy: { createdAt: "desc" } },
      user: true
    }
  });
  if (!order) return null;

  await cancelOrderIfEligible({
    orderId: order.id,
    userId: user.id,
    reason: "payment_timeout",
    actorId: null
  });

  const freshOrder = await prisma.order.findFirst({
    where: { id: Number(id), userId: user.id },
    include: {
      address: true,
      items: true,
      logs: { orderBy: { createdAt: "desc" } },
      packages: true,
      payments: { orderBy: { createdAt: "desc" } },
      mediaAssets: { where: { usage: "qc_photo" }, orderBy: { createdAt: "desc" } },
      user: true
    }
  });
  if (!freshOrder) return null;

  const shippingAddress = addressSnapshot(freshOrder.shippingAddressSnapshot) ?? freshOrder.address;
  const mappedPackages = freshOrder.packages.map((pkg) => ({
    id: String(pkg.id),
    packageNo: pkg.packageNo
  }));
  const paymentHref = freshOrder.orderStatus === "pending_payment" && freshOrder.paymentStatus !== "paid" && Number(freshOrder.unpaidUsd) > 0
    ? `/account/orders/${freshOrder.id}/pay`
    : undefined;
  const valueAddedServices = readValueAddedServicesSnapshot(freshOrder.valueAddedServicesSnapshot);
  const canCancel = canCustomerCancelOrder(freshOrder);
  const autoCancelAt = canCancel ? getAutoCancelDeadline(freshOrder.createdAt).toLocaleString() : undefined;

  return {
    id: String(freshOrder.id),
    orderNo: freshOrder.orderNo,
    createdAt: freshOrder.createdAt.toLocaleString(),
    orderSource: freshOrder.orderSource || "checkout",
    items: freshOrder.items.map((item) => ({
      id: String(item.id),
      productId: item.productCacheId,
      title: item.title,
      sku: item.skuText || "Default SKU",
      quantity: item.quantity,
      priceUsd: Number(item.priceUsd),
      priceCny: Number(item.priceCny),
      image: item.image,
      sourceUrl: item.sourceUrl,
      platform: item.platform
    })),
    totalUsd: Number(freshOrder.totalUsd),
    subtotalCny: Number(freshOrder.subtotalCny),
    serviceFeeUsd: Number(freshOrder.serviceFeeUsd),
    domesticShippingUsd: Number(freshOrder.domesticShippingUsd),
    valueAddedServicesUsd: Number(freshOrder.valueAddedServicesUsd),
    valueAddedServices,
    estimatedShippingUsd: Number(freshOrder.estimatedShippingUsd),
    actualShippingUsd: Number(freshOrder.actualShippingUsd),
    paidUsd: Number(freshOrder.paidUsd),
    unpaidUsd: Number(freshOrder.unpaidUsd),
    paymentStatus: freshOrder.paymentStatus,
    purchaseStatus: freshOrder.purchaseStatus,
    warehouseStatus: freshOrder.warehouseStatus,
    packageStatus: freshOrder.packageStatus,
    shippingPaymentStatus: freshOrder.shippingPaymentStatus,
    shippingStatus: freshOrder.shippingStatus,
    status: freshOrder.orderStatus,
    destinationCountry: freshOrder.destinationCountry || shippingAddress?.country || "",
    address: {
      name: shippingAddress?.contactName || freshOrder.user.name || "Customer",
      phone: shippingAddress?.phone || "",
      email: freshOrder.user.email,
      country: shippingAddress?.country || "",
      state: shippingAddress?.state || "",
      city: shippingAddress?.city || "",
      postalCode: shippingAddress?.postalCode || "",
      line1: shippingAddress?.line1 || "",
      line2: shippingAddress?.line2 || undefined
    },
    packages: mappedPackages,
    payments: freshOrder.payments.map((payment) => ({
      paymentNo: payment.paymentNo,
      method: payment.paymentMethod || payment.provider,
      amountUsd: Number(payment.amount),
      status: payment.status,
      createdAt: payment.createdAt.toLocaleString()
    })),
    qcPhotos: freshOrder.mediaAssets.map((asset) => ({
      id: String(asset.id),
      url: asset.url,
      altText: asset.altText || undefined,
      originalName: asset.originalName,
      createdAt: asset.createdAt.toLocaleString()
    })),
    timeline: freshOrder.logs.map((log) => ({
      title: translateTimelineAction(log.action, t),
      description: translateTimelineDetail(log.action, log.detail, t, statusT),
      status: inferTimelineEntryStatus(log.action, log.detail),
      time: log.createdAt.toLocaleString()
    })),
    userNote: freshOrder.userNote || undefined,
    paymentHref,
    canCancel,
    autoCancelAt
  };
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className="mt-1 break-words font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function MoneyLine({ label, usd, cny, positive, warning }: { label: string; usd: number; cny?: number; positive?: boolean; warning?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className={positive ? "mt-2 text-xl font-black text-emerald-700" : warning ? "mt-2 text-xl font-black text-amber-700" : "mt-2 text-xl font-black text-slate-950"}>{money(usd)}</div>
      {typeof cny === "number" ? <div className="mt-1 text-xs font-semibold text-slate-400">CN ￥{cny.toFixed(2)}</div> : null}
    </div>
  );
}

function MobileInfoRow({ label, value, emphasis = false }: { label: string; value: React.ReactNode; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3">
      <div className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className={emphasis ? "text-sm font-black text-amber-700" : "text-sm font-black text-slate-950"}>{value}</div>
    </div>
  );
}

type OrderValueAddedServiceSnapshot = {
  serviceId: number;
  code: string;
  name: string;
  chargeStandard: string;
  priceUsd: number;
  priceMode: string;
  quantity: number;
  subtotalUsd: number;
  note?: string;
};

function readValueAddedServicesSnapshot(value: unknown): OrderValueAddedServiceSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is OrderValueAddedServiceSnapshot => {
    if (!item || typeof item !== "object") return false;
    const service = item as Partial<OrderValueAddedServiceSnapshot>;
    return Boolean(service.serviceId && service.code && service.name && service.quantity);
  });
}

type AddressSnapshot = {
  contactName?: string | null;
  phone?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  postalCode?: string | null;
  line1?: string | null;
  line2?: string | null;
};

function addressSnapshot(value: unknown): AddressSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as AddressSnapshot;
}

function labelizeSource(
  value: string,
  t: Awaited<ReturnType<typeof getTranslations<"account.orderSources">>>
) {
  return t.has(value)
    ? t(value)
    : value
        .replaceAll("_", " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function labelizeTimelineStatus(
  value: "done" | "current" | "pending",
  t: Awaited<ReturnType<typeof getTranslations<"account.orderDetail">>>
) {
  if (value === "done") return t("states.timelineDone");
  if (value === "current") return t("states.timelineCurrent");
  return t("states.timelinePending");
}

function displayCountry(country: string) {
  return countryName(country) || country || "-";
}

function timelineTone(status: "done" | "current" | "pending") {
  if (status === "done") return "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700";
  if (status === "current") return "rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700";
  return "rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600";
}

function translateTimelineAction(
  action: string,
  t: Awaited<ReturnType<typeof getTranslations<"account.orderDetail">>>
) {
  const actionMap: Record<string, string> = {
    order_created: t("timelineActions.orderCreated"),
    payment_paid: t("timelineActions.paymentPaid"),
    shipping_payment_paid: t("timelineActions.shippingPaymentPaid"),
    order_workflow_action: t("timelineActions.orderWorkflowUpdated"),
    order_status_updated: t("timelineActions.orderStatusUpdated"),
    package_updated: t("timelineActions.packageUpdated"),
    order_qc_shared: t("timelineActions.qcPhotosShared"),
    order_qc_confirmed: t("timelineActions.qcPhotosConfirmed"),
    customer_qc_confirmed: t("timelineActions.qcPhotosConfirmed"),
    order_note_added: t("timelineActions.orderNoteAdded"),
    shipping_address_updated: t("timelineActions.shippingAddressUpdated"),
    refund_created: t("timelineActions.refundCreated"),
    payment_refunded: t("timelineActions.paymentRefunded"),
    sepa_transfer_submitted: t("timelineActions.sepaTransferSubmitted"),
    order_cancelled_by_customer: t("timelineActions.orderCancelled"),
    order_auto_cancelled: t("timelineActions.orderCancelled"),
    package_shipping_checkout_created: t("timelineActions.shippingCheckoutCreated"),
    mock_order_checkout_created: t("timelineActions.checkoutCreated"),
    order_marked_paid: t("timelineActions.orderMarkedPaid"),
    admin_status_updated: t("timelineActions.orderDetailsUpdated")
  };

  return actionMap[action] ?? action.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function translateTimelineDetail(
  action: string,
  detail: string | null | undefined,
  t: Awaited<ReturnType<typeof getTranslations<"account.orderDetail">>>,
  statusT: Awaited<ReturnType<typeof getTranslations<"account.statuses">>>
) {
  if (!detail) return t("timelineDetails.default");

  if (action === "order_status_updated" && detail.startsWith("Order workflow action: ")) {
    return describeWorkflowAction(detail.replace("Order workflow action: ", ""), t);
  }

  if (action === "order_workflow_action") {
    return describeWorkflowAction(detail, t);
  }

  if (action === "payment_paid") {
    const matched = detail.match(/^(.+?) paid \$(\d+(?:\.\d+)?) \((.+)\)$/);
    if (matched) {
      const [, provider, amount, paymentNo] = matched;
      return t("timelineDetails.paymentPaid", { provider, amount, paymentNo });
    }
  }

  if (action === "shipping_payment_paid") {
    const matched = detail.match(/^(.+?) shipping paid \$(\d+(?:\.\d+)?) \((.+)\)$/);
    if (matched) {
      const [, provider, amount, paymentNo] = matched;
      return t("timelineDetails.shippingPaymentPaid", { provider, amount, paymentNo });
    }
  }

  if (action === "package_updated") {
    const matched = detail.match(/^Package (.+?) updated to ([a-z_]+)(?:, tracking (.+))?$/);
    if (matched) {
      const [, packageNo, status, trackingNumber] = matched;
      const readableStatus = statusT.has(status) ? statusT(status) : status.replaceAll("_", " ");
      return trackingNumber
        ? t("timelineDetails.packageUpdatedWithTracking", { packageNo, status: readableStatus, trackingNumber })
        : t("timelineDetails.packageUpdated", { packageNo, status: readableStatus });
    }
  }

  if (action === "order_created") {
    const matched = detail.match(/^Order (.+) created from checkout(?: with (.+))?$/);
    if (matched) {
      const [, orderNo] = matched;
      return t("timelineDetails.orderCreatedFromCheckout", { orderNo });
    }
  }

  if (action === "order_cancelled_by_customer") {
    return t("timelineDetails.orderCancelledByCustomer");
  }

  if (action === "order_auto_cancelled") {
    return t("timelineDetails.orderAutoCancelled");
  }

  if (action === "customer_qc_confirmed" || (action === "order_qc_confirmed" && detail === "Customer confirmed QC photos")) {
    return t("timelineDetails.customerConfirmedQcPhotos");
  }

  if (action === "order_qc_shared") {
    if (detail === "QC photos sent to customer by email") return t("timelineDetails.qcPhotosSentByEmail");
    if (detail === "QC photos sent to customer") return t("timelineDetails.qcPhotosSentToCustomer");
  }

  if (action === "sepa_transfer_submitted") {
    return t("timelineDetails.sepaTransferSubmitted");
  }

  return detail;
}

function describeWorkflowAction(
  detail: string,
  t: Awaited<ReturnType<typeof getTranslations<"account.orderDetail">>>
) {
  const workflowDetailMap: Record<string, string> = {
    "Marked product payment as paid": t("timelineDetails.markedProductPaymentPaid"),
    "Queued product payment reminder": t("timelineDetails.queuedProductPaymentReminder"),
    "Moved order into admin review": t("timelineDetails.movedOrderIntoAdminReview"),
    "Review approved, order ready for purchase": t("timelineDetails.reviewApprovedReadyForPurchase"),
    "Marked order for risk review": t("timelineDetails.markedOrderForRiskReview"),
    "Risk review rejected, refund pending": t("timelineDetails.riskReviewRejectedRefundPending"),
    "Started purchasing": t("timelineDetails.startedPurchasing"),
    "Marked purchased": t("timelineDetails.markedPurchased"),
    "Marked partially purchased": t("timelineDetails.markedPartiallyPurchased"),
    "Marked purchase failed": t("timelineDetails.markedPurchaseFailed"),
    "Marked out of stock": t("timelineDetails.markedOutOfStock"),
    "Marked price changed, difference pending": t("timelineDetails.markedPriceChangedDifferencePending"),
    "Marked warehouse received": t("timelineDetails.markedWarehouseReceived"),
    "Marked partially received": t("timelineDetails.markedPartiallyReceived"),
    "Marked warehouse abnormal": t("timelineDetails.markedWarehouseAbnormal"),
    "Requested international shipping payment": t("timelineDetails.requestedInternationalShippingPayment"),
    "Marked ready to ship": t("timelineDetails.markedReadyToShip"),
    "Marked shipped": t("timelineDetails.markedShipped"),
    "Marked package in transit": t("timelineDetails.markedPackageInTransit"),
    "Marked completed": t("timelineDetails.markedCompleted"),
    "Marked abnormal": t("timelineDetails.markedAbnormal"),
    "Marked refund pending": t("timelineDetails.markedRefundPending"),
    "Marked refunded": t("timelineDetails.markedRefunded"),
    "Cancelled order": t("timelineDetails.cancelledOrder")
  };

  if (workflowDetailMap[detail]) return workflowDetailMap[detail];
  if (detail.startsWith("Created package ")) return t("timelineDetails.createdPackage", { packageNo: detail.replace("Created package ", "") });
  return detail;
}

function inferTimelineEntryStatus(action: string, detail?: string | null): "done" | "current" | "pending" {
  if (["order_auto_cancelled", "order_cancelled_by_customer", "payment_paid", "shipping_payment_paid", "order_created", "customer_qc_confirmed", "order_qc_confirmed", "sepa_transfer_submitted"].includes(action)) {
    return "done";
  }

  if (action === "order_status_updated" && detail?.startsWith("Order workflow action: request_shipping_payment")) {
    return "pending";
  }

  if (action === "order_workflow_action" && detail === "Requested international shipping payment") {
    return "pending";
  }

  if (action.includes("pending")) return "pending";
  return "current";
}

function nextStepNotice(order: {
  status: string;
  autoCancelAt?: string;
  packages: Array<{ id: string; packageNo: string }>;
  warehouseStatus: string;
  packageStatus: string;
  shippingPaymentStatus?: string;
  shippingStatus: string;
  actualShippingUsd: number;
}, t: Awaited<ReturnType<typeof getTranslations<"account.orderDetail">>>) {
  if (order.status === "pending_payment" && order.autoCancelAt) {
    return {
      tone: "warning" as const,
      title: t("nextStep.pendingPaymentTitle"),
      description: t("nextStep.pendingPaymentDescription", { deadline: order.autoCancelAt })
    };
  }

  if (order.warehouseStatus === "received" && order.packageStatus === "none") {
    return {
      tone: "info" as const,
      title: t("nextStep.warehouseArrivalTitle"),
      description: t("nextStep.warehouseArrivalDescription")
    };
  }

  if (order.packageStatus === "created" || order.shippingPaymentStatus === "none") {
    return {
      tone: "info" as const,
      title: t("nextStep.preparingParcelTitle"),
      description: t("nextStep.preparingParcelDescription")
    };
  }

  if (order.shippingPaymentStatus === "pending" || order.packageStatus === "waiting_shipping_payment") {
    const packageId = order.packages[0]?.id;
    return {
      tone: "warning" as const,
      title: t("nextStep.shippingPaymentTitle"),
      description: t("nextStep.shippingPaymentDescription"),
      actionLabel: t("nextStep.shippingPaymentAction"),
      actionHref: packageId ? `/account/packages/${packageId}/pay` : undefined
    };
  }

  if (order.shippingStatus === "ready_to_ship" || order.packageStatus === "shipping_paid") {
    return {
      tone: "success" as const,
      title: t("nextStep.shippingPaidTitle"),
      description: t("nextStep.shippingPaidDescription")
    };
  }

  return null;
}
