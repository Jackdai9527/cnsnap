import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { money } from "@/lib/currency";
import { countryName } from "@/lib/countries";
import { Button } from "@/components/ui/button";
import { requireActiveUserPage } from "@/lib/session";
import { StatusPill } from "@/components/ui/StatusPill";
import { OnlyPayButton } from "@/components/payment/OnlyPayButton";
import { PayPalPayment } from "@/components/payment/PayPalPayment";
import { SepaInstantPayment } from "@/components/payment/SepaInstantPayment";
import { getSepaSettings } from "@/modules/payment/sepa";
import { WalletCards } from "lucide-react";

type OrderDetailProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UserOrderDetailPage({ params, searchParams }: OrderDetailProps) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireActiveUserPage(`/user/orders/${id}`);
  const paymentNotice = Array.isArray(query.payment) ? query.payment[0] : query.payment;
  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
    include: { user: true, items: true, packages: true, address: true, payments: { orderBy: { createdAt: "desc" } }, logs: { orderBy: { createdAt: "desc" } } }
  });
  if (!order || order.userId !== user.id) notFound();
  const sepaSettings = await getSepaSettings();
  const dueUsd = Number(order.unpaidUsd);
  const subtotalUsd = Number(order.subtotalUsd);
  const serviceFeeUsd = Number(order.serviceFeeUsd);
  const totalUsd = Number(order.totalUsd);
  const shippingAddress = addressSnapshot(order.shippingAddressSnapshot) ?? order.address;
  const shippingPaymentHref = order.packages[0] ? `/account/packages/${order.packages[0].id}/pay` : undefined;
  const waitingShippingPayment = order.shippingPaymentStatus === "pending" || order.packageStatus === "waiting_shipping_payment";

  return (
    <div className="mx-auto max-w-4xl">
      <header className="border-b border-[#d9e7ff] pb-5">
        <Link href="/" className="inline-flex items-baseline text-2xl font-black tracking-tight">
          <span className="text-[#e60012]">CN</span><span className="text-[#44c9ff]">Snap</span>
        </Link>
        <nav className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-[#8a8190]">
          <Link href="/cart" className="text-[#e60012]">Cart</Link>
          <span>/</span>
          <span className="text-[#111827]">Information</span>
          <span>/</span>
          <span>Shipping</span>
          <span>/</span>
          <span>Payment</span>
        </nav>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-[#111827]">Checkout</h1>
            <p className="mt-1 text-sm font-semibold text-[#667085]">Order {order.orderNo}</p>
          </div>
          <StatusPill status={order.orderStatus} />
        </div>
      </header>

      <div className="mt-6 space-y-4">
        {waitingShippingPayment && shippingPaymentHref ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
            <div className="text-xs font-black uppercase tracking-[0.12em] text-amber-700">What happens next</div>
            <div className="mt-2 text-base font-black text-[#111827]">International shipping payment is required.</div>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              Your parcel is ready for the next step. Please pay the international shipping fee so we can dispatch it.
            </p>
            <div className="mt-4">
              <Button asChild>
                <Link href={shippingPaymentHref}>
                  <WalletCards />
                  Pay Shipping Fee
                </Link>
              </Button>
            </div>
          </div>
        ) : null}

        <CheckoutBox title="Contact" action={<Link href="/user" className="text-xs font-black text-[#e60012]">Account</Link>}>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <div className="font-black text-[#111827]">{order.user.email}</div>
              <div className="mt-1 font-semibold text-[#8a8190]">{order.user.name || "CNSnap customer"}</div>
            </div>
            <span className="rounded-full bg-[#f8eef3] px-3 py-1 text-xs font-black text-[#667085]">Customer ID {order.userId}</span>
          </div>
        </CheckoutBox>

        <CheckoutBox title="Ship to" action={<Link href="/user/addresses" className="text-xs font-black text-[#e60012]">Change</Link>}>
          {shippingAddress ? (
            <AddressBlock
              lines={[
                shippingAddress.contactName ?? "",
                shippingAddress.phone ?? "",
                `${shippingAddress.line1 ?? ""}${shippingAddress.line2 ? `, ${shippingAddress.line2}` : ""}`,
                `${shippingAddress.city ?? ""}, ${shippingAddress.state || ""} ${shippingAddress.postalCode ?? ""}, ${shippingAddress.country ? countryName(shippingAddress.country) : ""}`
              ]}
            />
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
              No shipping address is attached yet. Add one in <Link href="/user/addresses" className="underline">Addresses</Link>.
            </div>
          )}
        </CheckoutBox>

        <CheckoutBox title="Shipping method">
            <div className="rounded-xl border border-[#d9e7ff] bg-[#fffafd] p-4">
              <div className="text-sm font-black text-[#111827]">Purchasing agent warehouse handling</div>
              <p className="mt-1 text-xs font-semibold leading-5 text-[#8a8190]">
              China shipping is paid during checkout. Final international freight is confirmed after purchase, warehouse receiving, QC review, and parcel measurement.
              </p>
            </div>
          </CheckoutBox>

        <CheckoutBox title="Payment" description="All transactions are encrypted. Available methods depend on your address and currency.">
          {paymentNotice === "sepa_submitted" ? (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              SEPA transfer submitted. We will confirm it after the bank payment arrives.
            </div>
          ) : null}
          <div className="rounded-xl border border-[#d9e7ff] bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-black text-[#111827]">Payment due</div>
                <p className="mt-1 text-xs font-semibold text-[#8a8190]">Order balance after paid amount and adjustments.</p>
              </div>
              <div className="text-2xl font-black text-[#e60012]">{money(dueUsd)}</div>
            </div>
            {order.paymentStatus !== "paid" && dueUsd > 0 ? (
              <>
                <OnlyPayButton orderId={order.id} />
                <PayPalPayment orderId={order.id} />
                <SepaInstantPayment order={order} settings={sepaSettings} />
              </>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">Payment completed</div>
            )}
          </div>
        </CheckoutBox>

        <CheckoutBox title="Order summary" action={<Link href="/user/orders" className="text-xs font-black text-[#e60012]">Back to orders</Link>}>
          <div className="divide-y divide-[#d9e7ff]">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4 py-4 first:pt-0">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-[#d9e7ff] bg-[#f7fbff]">
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

          <dl className="mt-4 space-y-3 border-t border-[#d9e7ff] pt-4 text-sm">
            <SummaryRow label="Subtotal" value={money(subtotalUsd)} />
            <SummaryRow label="Service fee" value={money(serviceFeeUsd)} />
            <SummaryRow label="Paid" value={money(Number(order.paidUsd))} />
            <SummaryRow label="Discount" value={money(Number(order.discountUsd))} />
            <SummaryRow label="Refund" value={money(Number(order.refundUsd))} />
            <SummaryRow label="Total" value={money(totalUsd)} strong />
            <SummaryRow label="Due today" value={money(dueUsd)} strong highlight />
          </dl>
        </CheckoutBox>

        {order.payments.length ? (
          <CheckoutBox title="Payment activity">
            <div className="divide-y divide-[#d9e7ff] rounded-xl border border-[#d9e7ff] bg-white">
              {order.payments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                  <div>
                    <div className="font-black text-[#111827]">{payment.provider.toUpperCase()}</div>
                    <div className="text-xs font-semibold text-[#8a8190]">{payment.paymentNo}</div>
                  </div>
                  <div className="font-black text-[#111827]">{payment.currency} {Number(payment.amount).toFixed(2)}</div>
                  <StatusPill status={payment.status} />
                </div>
              ))}
            </div>
          </CheckoutBox>
        ) : null}

        <CheckoutBox title="Order timeline">
          <div className="space-y-2">
            {order.logs.map((log) => (
              <div key={log.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d9e7ff] bg-white px-4 py-3 text-sm">
                <span className="font-black text-[#111827]">{log.action}</span>
                <span className="font-semibold text-[#8a8190]">{log.createdAt.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CheckoutBox>
      </div>
    </div>
  );
}

function CheckoutBox({ title, description, action, children }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#d9e7ff] bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[#111827]">{title}</h2>
          {description ? <p className="mt-1 text-sm font-semibold leading-6 text-[#8a8190]">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function AddressBlock({ lines }: { lines: string[] }) {
  return (
    <div className="rounded-xl border border-[#d9e7ff] bg-[#fffafd] p-4 text-sm font-semibold leading-7 text-[#667085]">
      {lines.filter(Boolean).map((line, index) => (
        <div key={`${index}-${line}`} className={index === 0 ? "font-black text-[#111827]" : ""}>{line}</div>
      ))}
    </div>
  );
}

function SummaryRow({ label, value, strong = false, highlight = false }: { label: string; value: string; strong?: boolean; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${strong ? "pt-2 text-base" : ""}`}>
      <dt className={`font-semibold ${highlight ? "text-[#111827]" : "text-[#667085]"}`}>{label}</dt>
      <dd className={`font-black ${highlight ? "text-xl text-[#e60012]" : "text-[#111827]"}`}>{value}</dd>
    </div>
  );
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
