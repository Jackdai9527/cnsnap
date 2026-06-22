import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { money } from "@/lib/currency";
import { getCurrentUser } from "@/lib/session";
import { StatusPill } from "@/components/ui/StatusPill";

export default async function UserOrdersPage() {
  const user = await getCurrentUser();
  const orders = await prisma.order.findMany({
    where: { userId: user?.id },
    include: { items: { orderBy: { id: "asc" }, take: 3 } },
    orderBy: { createdAt: "desc" },
    take: 40
  });

  return (
    <section className="space-y-5">
      <div className="brand-surface rounded-[28px] p-6 md:p-7">
        <div className="label">Purchasing history</div>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-5xl font-black text-[#101828]">Orders</h1>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">Open an order to review details, payment status, and available payment methods.</p>
          </div>
          <span className="w-fit rounded-full border border-[#dfe7f1] bg-white px-3 py-1.5 text-xs font-extrabold text-[#667085]">{orders.length} recent orders</span>
        </div>
      </div>

      <div className="space-y-3">
        {orders.length ? orders.map((order) => {
          const dueUsd = Number(order.unpaidUsd);
          const canPay = order.paymentStatus !== "paid" && dueUsd > 0;
          return (
            <Link
              key={order.id}
              href={`/user/orders/${order.id}`}
              prefetch={false}
              className="panel group grid gap-4 p-4 transition hover:-translate-y-0.5 hover:border-[#2563eb] hover:shadow-[0_18px_42px_rgba(37,99,235,0.12)] md:grid-cols-[minmax(0,1fr)_auto]"
            >
              <div className="flex min-w-0 gap-4">
                <div className="flex shrink-0 -space-x-2">
                  {order.items.length ? order.items.map((item) => (
                    <span key={item.id} className="relative block size-12 overflow-hidden rounded-2xl border-2 border-white bg-[#f8fafc] shadow-sm">
                      <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />
                    </span>
                  )) : (
                    <span className="grid size-12 place-items-center rounded-2xl border border-[#dfe7f1] bg-[#f8fafc] text-xs font-black text-[#98a2b3]">No img</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-base font-extrabold text-[#101828]">{order.orderNo}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusPill status={order.orderStatus} />
                    <StatusPill status={order.paymentStatus} />
                    <span className="badge">{order.items.length} items</span>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-[#98a2b3]">{order.createdAt.toLocaleString()}</div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-[#eef2f7] pt-3 md:block md:border-t-0 md:pt-0 md:text-right">
                <div>
                  <div className="font-display text-3xl font-black text-[#d9142f]">{money(Number(order.totalUsd))}</div>
                  <div className="mt-1 text-xs font-bold text-[#667085]">Due {money(dueUsd)}</div>
                </div>
                <span className={canPay ? "btn-primary mt-0 rounded-xl px-4 py-2 md:mt-3" : "btn-secondary mt-0 rounded-xl px-4 py-2 md:mt-3"}>
                  {canPay ? "Pay / View" : "View"}
                </span>
              </div>
            </Link>
          );
        }) : (
          <div className="panel p-8 text-sm font-semibold text-[#667085]">No orders yet.</div>
        )}
      </div>
    </section>
  );
}
