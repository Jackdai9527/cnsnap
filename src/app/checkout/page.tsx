import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, CreditCard, Landmark, LockKeyhole, WalletCards } from "lucide-react";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { ClearCartOnOrder } from "@/components/checkout/ClearCartOnOrder";
import { BalancePaymentButton } from "@/components/payment/BalancePaymentButton";
import { CheckoutPaymentMethods } from "@/components/payment/CheckoutPaymentMethods";
import { OnlyPayButton } from "@/components/payment/OnlyPayButton";
import { PayPalPayment } from "@/components/payment/PayPalPayment";
import { SepaInstantPayment } from "@/components/payment/SepaInstantPayment";
import { StatusPill } from "@/components/ui/StatusPill";
import { cancelOrderIfEligible, getAutoCancelDeadline } from "@/lib/account/order-cancellation";
import { countryName } from "@/lib/countries";
import { money } from "@/lib/currency";
import { prisma } from "@/lib/db";
import { buildOrderFeeSnapshot } from "@/lib/order-fee-snapshot";
import { requireActiveUserPage } from "@/lib/session";
import { serializeValueAddedService } from "@/lib/value-added-services";
import { getOnlyPaySettings, onlyPayReady } from "@/modules/payment/onlypay";
import { getPayPalSettings, paypalReady } from "@/modules/payment/paypal";
import { getSepaSettings, isSepaEligible, sepaReady } from "@/modules/payment/sepa";
import { createMetadataFromIndexPolicy } from "@/modules/seo/lib/metadata";

type CheckoutPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(): Promise<Metadata> {
  const seo = await createMetadataFromIndexPolicy("/checkout", {
    title: "Checkout",
    description: "Secure checkout for purchasing agent orders."
  });
  return seo.metadata;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const orderId = readParam(params, "order");
  const packageId = readParam(params, "package");
  const paymentNotice = readParam(params, "payment");
  const user = await requireActiveUserPage("/checkout");

  if (orderId) {
    return <CreatedOrderCheckout orderId={Number(orderId)} packageId={packageId ? Number(packageId) : undefined} paymentNotice={paymentNotice} userId={user.id} />;
  }

  const [addresses, valueAddedServices] = await Promise.all([
    user
      ? prisma.address.findMany({
          where: { userId: user.id },
          orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }]
        })
      : [],
    prisma.valueAddedService.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
    })
  ]);

  return (
    <CheckoutClient
      userEmail={user?.email}
      valueAddedServices={valueAddedServices.map(serializeValueAddedService)}
      addresses={addresses.map((address) => ({
        id: address.id,
        label: address.label,
        contactName: address.contactName,
        phone: address.phone,
        country: address.country,
        state: address.state,
        city: address.city,
        postalCode: address.postalCode,
        line1: address.line1,
        line2: address.line2,
        isDefault: address.isDefault
      }))}
    />
  );
}

async function CreatedOrderCheckout({ orderId, packageId, paymentNotice, userId }: { orderId: number; packageId?: number; paymentNotice?: string; userId: number }) {
  await cancelOrderIfEligible({
    orderId,
    userId,
    reason: "payment_timeout",
    actorId: null
  });

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { user: true, items: true, address: true, packages: { orderBy: { createdAt: "desc" } }, payments: { orderBy: { createdAt: "desc" } } }
  });
  if (!order) notFound();
  if (["cancel", "cancelled"].includes(order.orderStatus)) notFound();

  const [onlyPaySettings, paypalSettings, sepaSettings] = await Promise.all([
    getOnlyPaySettings(),
    getPayPalSettings(),
    getSepaSettings()
  ]);
  const dueUsd = Number(order.unpaidUsd);
  const targetPackage = packageId ? order.packages.find((pkg) => pkg.id === packageId) : undefined;
  const isPackageShippingPayment = Boolean(targetPackage);
  const displayedDueUsd = isPackageShippingPayment ? Number(targetPackage?.shippingFeeUsd ?? dueUsd) : dueUsd;
  const feeSnapshot = buildOrderFeeSnapshot({
    subtotalUsd: Number(order.subtotalUsd),
    subtotalCny: Number(order.subtotalCny),
    domesticShippingUsd: Number(order.domesticShippingUsd),
    serviceFeeUsd: Number(order.serviceFeeUsd),
    valueAddedServicesUsd: Number(order.valueAddedServicesUsd),
    paidUsd: Number(order.paidUsd),
    unpaidUsd: Number(order.unpaidUsd),
    totalUsd: Number(order.totalUsd)
  });
  const preferredPaymentMethod = (order.preferredPaymentMethod || "").toLowerCase();
  const valueAddedServices = readValueAddedServicesSnapshot(order.valueAddedServicesSnapshot);
  const sepaEligible = isSepaEligible({
    currency: order.currency,
    countryCode: order.address?.country || order.destinationCountryCode || order.destinationCountry
  });
  const showOnlyPay = onlyPayReady(onlyPaySettings);
  const showPayPal = paypalReady(paypalSettings);
  const showSepa = sepaSettings.enabled && sepaEligible && sepaReady(sepaSettings);
  const paymentOptions = [
    {
      id: "balance",
      title: "CNSnap Balance",
      subtitle: "Recharge balance or affiliate commission balance",
      icon: <WalletCards size={18} className="text-[#e60012]" />,
      content: (
        <BalancePaymentButton
          orderId={order.id}
          packageId={packageId}
          amountDue={displayedDueUsd}
          currentBalance={Number(order.user.walletBalance)}
          preferred={preferredPaymentMethod === "balance"}
        />
      )
    },
    ...(showOnlyPay ? [{
      id: "onlypay",
      title: onlyPaySettings.title,
      subtitle: "Credit card, Google Pay, Apple Pay",
      icon: <CreditCard size={18} className="text-[#e60012]" />,
      content: <OnlyPayButton orderId={order.id} packageId={packageId} />
    }] : []),
    ...(showPayPal ? [{
      id: "paypal",
      title: paypalSettings.title,
      subtitle: "PayPal wallet and eligible cards",
      icon: <CreditCard size={18} className="text-[#e60012]" />,
      content: <PayPalPayment orderId={order.id} packageId={packageId} />
    }] : []),
    ...(showSepa ? [{
      id: "sepa",
      title: sepaSettings.title,
      subtitle: "Manual bank transfer confirmation",
      icon: <Landmark size={18} className="text-[#e60012]" />,
      content: <SepaInstantPayment order={order} packageId={packageId} settings={sepaSettings} />
    }] : [])
  ];
  const initialPaymentMethod = paymentOptions.some((option) => option.id === preferredPaymentMethod)
    ? preferredPaymentMethod
    : paymentOptions[0]?.id ?? "";

  return (
    <div className="min-h-[100dvh] bg-white">
      <ClearCartOnOrder />
      <div className="mx-auto grid max-w-[1180px] lg:grid-cols-[minmax(0,660px)_minmax(360px,1fr)]">
        <section className="px-4 py-8 sm:px-8 lg:min-h-[100dvh] lg:border-r lg:border-[#eadfe4] lg:py-10">
          <Link href="/" className="inline-flex items-center" aria-label="CNSnap home">
            <Image
              src="/brand/cnsnap-logo.svg"
              alt="CNSnap"
              width={1540}
              height={453}
              priority
              className="h-[42px] w-auto"
            />
          </Link>
          <nav className="mt-5 flex flex-wrap items-center gap-2 text-xs font-black text-[#9b92a0]">
            <Link href="/cart" className="text-[#e60012]">Cart</Link>
            <span>/</span>
            <span>Information</span>
            <span>/</span>
            <span className="text-[#111827]">Payment</span>
          </nav>

          <section className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={24} />
              <div>
                <h1 className="text-2xl font-black tracking-tight text-[#111827]">{isPackageShippingPayment ? "Shipping payment" : "Order created"}</h1>
                <p className="mt-1 text-sm font-bold text-emerald-800">
                  {isPackageShippingPayment && targetPackage
                    ? `Package ${targetPackage.packageNo} is ready for international freight payment.`
                    : `${order.orderNo} is ready for payment review.`}
                </p>
                {!isPackageShippingPayment ? (
                  <p className="mt-2 text-sm font-semibold leading-6 text-emerald-900">
                    Current payment only includes item cost, China shipping, service fee, and any selected value-added services. International shipping is confirmed and paid later after warehouse processing.
                  </p>
                ) : null}
                {!isPackageShippingPayment && order.orderStatus === "pending_payment" && Number(order.paidUsd) <= 0.01 ? (
                  <p className="mt-2 text-sm font-semibold leading-6 text-emerald-900">
                    If payment is not completed by {getAutoCancelDeadline(order.createdAt).toLocaleString()}, this order will be cancelled automatically and you will need to place a new order.
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <div className="mt-6 space-y-5">
            <CheckoutBox title="Contact" action={<StatusPill status={order.orderStatus} />}>
              <div className="rounded-xl border border-[#e8dce2] bg-[#fffafd] px-4 py-3 text-sm font-bold text-[#111827]">{order.user.email}</div>
            </CheckoutBox>

            <CheckoutBox title="Ship to" action={<Link href="/account/addresses" className="text-xs font-black text-[#e60012]">Manage</Link>}>
              {order.address ? (
                <div className="rounded-xl border border-[#e8dce2] bg-[#fffafd] p-4 text-sm font-semibold leading-7 text-[#667085]">
                  <div className="font-black text-[#111827]">{order.address.contactName}</div>
                  <div>{order.address.phone}</div>
                  <div>{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}</div>
                  <div>{order.address.city}, {order.address.state || ""} {order.address.postalCode}, {countryName(order.address.country)}</div>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
                  No shipping address is attached yet. Add one before final shipment.
                </div>
              )}
            </CheckoutBox>

            <CheckoutBox title="Payment" description={isPackageShippingPayment ? "Choose an available method to pay the international shipping fee for this package." : "Choose an available method to pay the product order balance."}>
              {paymentNotice === "sepa_submitted" ? (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                  SEPA transfer submitted. We will confirm it after the bank payment arrives.
                </div>
              ) : null}
              <div className="rounded-2xl bg-[#fffafd] p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#fff1f2] text-[#e60012]">
                      <LockKeyhole size={18} />
                    </span>
                    <div>
                      <div className="font-black text-[#111827]">
                        {isPackageShippingPayment ? "Shipping fee to pay now" : "Amount to pay now"}
                      </div>
                      <p className="mt-1 text-sm font-semibold text-[#667085]">
                        {isPackageShippingPayment
                          ? "This is the shipping fee you need to pay now."
                          : "This is the amount you need to pay now."}
                      </p>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-[#e60012]">{money(displayedDueUsd)}</div>
                </div>
                {order.paymentStatus !== "paid" && displayedDueUsd > 0 ? (
                  <>
                    {paymentOptions.length ? (
                      <CheckoutPaymentMethods initialMethod={initialPaymentMethod} options={paymentOptions} />
                    ) : (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
                        No payment gateway is currently available for this order. Please contact support.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">Payment completed</div>
                )}
              </div>
            </CheckoutBox>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#d9e7ff] pt-5">
              <Link href="/search" className="text-sm font-black text-[#e60012]">Continue shopping</Link>
              <Link href={`/account/orders/${order.id}`} className="btn-secondary rounded-xl px-5 py-3">View order detail</Link>
            </div>
          </div>
        </section>

        <aside className="bg-[#f7fbff] px-4 py-8 sm:px-8 lg:sticky lg:top-0 lg:h-[100dvh] lg:overflow-y-auto lg:py-10">
          <section className="lg:max-w-[430px]">
            <div className="text-sm font-black text-[#111827]">Order summary</div>
            <div className="mt-6 divide-y divide-[#eadfe4]">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 py-4 first:pt-0">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-[#d9e7ff] bg-white">
                    <Image src={item.image} alt={item.title} fill sizes="64px" className="object-cover" />
                    <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#667085] text-[10px] font-black text-white">{item.quantity}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-sm font-black leading-5 text-[#111827]">{item.title}</div>
                    <div className="mt-1 text-xs font-semibold text-[#8a8190]">{item.skuText || "Default SKU"}</div>
                    <div className="mt-1 text-[11px] font-black uppercase text-[#e60012]">{item.platform}</div>
                  </div>
                  <div className="whitespace-nowrap text-sm font-black text-[#111827]">{money(Number(item.priceUsd) * item.quantity)}</div>
                </div>
              ))}
            </div>
            {valueAddedServices.length ? (
              <div className="mt-5 rounded-2xl border border-[#eadfe4] bg-white p-4">
                <div className="text-xs font-black uppercase text-[#e60012]">Value-added services</div>
                <div className="mt-3 space-y-3">
                  {valueAddedServices.map((service) => (
                    <div key={`${service.serviceId}-${service.code}`} className="flex items-start justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <div className="truncate font-black text-[#111827]">{service.name}</div>
                        <div className="mt-1 text-xs font-semibold text-[#8a8190]">{service.chargeStandard} x {service.quantity}</div>
                        {service.note ? <div className="mt-1 line-clamp-2 text-xs font-semibold text-[#8a8190]">{service.note}</div> : null}
                      </div>
                      <div className="whitespace-nowrap font-black text-[#111827]">{money(service.subtotalUsd)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <dl className="mt-5 space-y-3 border-t border-[#eadfe4] pt-5 text-sm">
              <SummaryRow label="Items subtotal" value={money(feeSnapshot.itemsSubtotalUsd)} />
              <SummaryRow label="China shipping" value={money(feeSnapshot.domesticShippingUsd)} />
              <SummaryRow label="Service fee" value={money(feeSnapshot.serviceFeeUsd)} />
              <SummaryRow label="Value-added services" value={money(feeSnapshot.valueAddedServicesUsd)} />
              <SummaryRow label="Paid" value={money(feeSnapshot.paidUsd)} />
              <SummaryRow label="Order total" value={money(feeSnapshot.orderTotalUsd)} strong />
              <SummaryRow label="Due today" value={money(displayedDueUsd)} highlight />
            </dl>
          </section>
        </aside>
      </div>
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

function CheckoutBox({ title, description, action, children }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#111827]">{title}</h2>
          {description ? <p className="mt-1 text-sm font-semibold leading-6 text-[#667085]">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SummaryRow({ label, value, strong = false, highlight = false }: { label: string; value: string; strong?: boolean; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${strong || highlight ? "border-t border-[#eadfe4] pt-4 text-lg" : ""}`}>
      <dt className="font-semibold text-[#667085]">{label}</dt>
      <dd className={`font-black ${highlight ? "text-2xl text-[#e60012]" : strong ? "text-2xl text-[#111827]" : "text-[#111827]"}`}>{value}</dd>
    </div>
  );
}

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}
