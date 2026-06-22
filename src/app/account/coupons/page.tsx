import Link from "next/link";
import { Gift, TicketPercent, Truck } from "lucide-react";
import { MobileCouponsWorkspace } from "@/components/account/mobile/MobileCouponsWorkspace";
import { MobileSectionShell } from "@/components/mobile/layout/MobileSectionShell";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { getAccountCouponsWorkspace } from "@/lib/account/workspaces";

export default async function AccountCouponsPage() {
  const workspace = await getAccountCouponsWorkspace();
  const title = "Coupons";
  const description = "Review shipping coupons, service-fee promotions, and discount-ready order scenarios.";

  return (
    <>
      <MobileSectionShell
        title={title}
        description={description}
        kicker={title}
        className="mobile-coupons-page md:hidden"
        minimalHeader
        showBackButton
      >
        <section className="card-stack-section">
          <div className="mobile-order-card p-4">
            <MobileCouponsWorkspace
              title={title}
              description={description}
              shippingCoupons={workspace.shippingCoupons}
              serviceDiscounts={workspace.serviceDiscounts}
              discountedOrders={workspace.discountedOrders}
              shippingCouponsLabel="Shipping coupons"
              serviceOffersLabel="Service-fee offers"
              discountReadyOrdersLabel="Discount-ready orders"
              discountReadyOrderTag="Discount-ready order"
              emptyTitle="No discounted order scenarios yet"
            />
          </div>
        </section>
      </MobileSectionShell>

      <div className="hidden md:block">
        <AccountPageHeader title={title} description={description} />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total offers" value={String(workspace.summary.totalCoupons)} icon={<Gift className="size-4" />} />
          <MetricCard label="Shipping coupons" value={String(workspace.summary.shippingCoupons)} icon={<Truck className="size-4" />} />
          <MetricCard label="Service discounts" value={String(workspace.summary.serviceDiscounts)} icon={<TicketPercent className="size-4" />} />
          <MetricCard label="Orders to review" value={String(workspace.summary.discountedOrders)} icon={<Gift className="size-4" />} />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <WorkbenchCard title="Shipping coupons">
            {workspace.shippingCoupons.map((coupon) => (
              <div key={coupon.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-black text-slate-950">{coupon.discount}</div>
                  <span className="rounded-full bg-[#fff3f5] px-2.5 py-1 text-[11px] font-black text-[#d9142f]">{coupon.validUntil}</span>
                </div>
                <div className="mt-2 text-sm text-slate-500">{coupon.minimumShippingFee}</div>
                <div className="mt-1 text-sm text-slate-500">{coupon.applicableCountries}</div>
                <div className="mt-1 text-sm text-slate-500">{coupon.applicableChannels}</div>
              </div>
            ))}
          </WorkbenchCard>

          <WorkbenchCard title="Service-fee promotions">
            {workspace.serviceDiscounts.map((discount) => (
              <div key={discount.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-black text-slate-950">{discount.id}</div>
                  <span className="rounded-full bg-[#f7fbff] px-2.5 py-1 text-[11px] font-black text-[#0a83ff]">{discount.discount}</span>
                </div>
              </div>
            ))}
          </WorkbenchCard>
        </section>

        <section className="mt-5">
          <WorkbenchCard title="Orders to review for discounts">
            {workspace.discountedOrders.length ? workspace.discountedOrders.map((order) => (
              <Link key={order.id} href={order.href} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-sm font-black text-slate-950">{order.orderNo}</div>
                <div className="text-sm font-black text-slate-950">${order.totalUsd.toFixed(2)}</div>
              </Link>
            )) : <EmptyCopy text="No discount-ready orders yet." />}
          </WorkbenchCard>
        </section>
      </div>
    </>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</div>
        <span className="grid size-9 place-items-center rounded-2xl bg-[#fff3f5] text-[#d9142f]">{icon}</span>
      </div>
      <div className="mt-3 text-2xl font-black text-slate-950">{value}</div>
    </article>
  );
}

function WorkbenchCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <div className="text-lg font-black text-slate-950">{title}</div>
      <div className="mt-4 grid gap-3">{children}</div>
    </section>
  );
}

function EmptyCopy({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm font-semibold text-slate-500">{text}</div>;
}
