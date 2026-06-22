import Link from "next/link";
import { ExternalLink, PackageCheck, ShoppingCart } from "lucide-react";
import { prisma } from "@/lib/db";
import { money } from "@/lib/currency";
import { getCurrentUser } from "@/lib/session";
import { StatusPill } from "@/components/ui/StatusPill";

export default async function UserDiyOrdersPage() {
  const user = await getCurrentUser();
  const orders = await prisma.diyOrder.findMany({ where: { userId: user?.id }, orderBy: { createdAt: "desc" } });

  return (
    <section className="space-y-5">
      <div className="brand-surface rounded-[28px] p-6 md:p-7">
        <div className="label">Manual purchasing</div>
        <h1 className="mt-2 font-display text-5xl font-black text-[#101828]">DIY Orders</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#667085]">
          After you confirm a DIY order and pay the product fee, our team records purchasing status, warehouse arrival, freight, and service fee here.
        </p>
      </div>

      <div className="space-y-4">
        {orders.length ? orders.map((order) => {
          const totalOperationalCost =
            Number(order.productCostUsd ?? 0) +
            Number(order.shippingFeeUsd ?? 0) +
            Number(order.serviceFeeUsd ?? 0);

          return (
            <article key={order.id} className="panel overflow-hidden">
              <div className="border-b border-[#dfe7f1] bg-[#f8fafc] p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status={order.status} />
                      <StatusPill status={order.purchaseStatus} />
                      <StatusPill status={order.warehouseStatus} />
                    </div>
                    <h2 className="mt-3 line-clamp-2 font-display text-3xl font-black text-[#101828]">
                      {order.purchaseItemName || order.productName || order.productUrl}
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-[#667085]">
                      DIY order date {order.createdAt.toLocaleDateString()} · Qty {order.quantity}
                    </p>
                  </div>
                  <div className="shrink-0 text-left md:text-right">
                    <div className="text-xs font-extrabold uppercase text-[#98a2b3]">Recorded total</div>
                    <div className="font-display text-3xl font-black text-[#d9142f]">{totalOperationalCost > 0 ? money(totalOperationalCost) : order.quoteUsd ? money(Number(order.quoteUsd)) : "-"}</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info label="Purchase item" value={order.purchaseItemName || order.productName || "-"} />
                  <Info label="Size" value={order.purchaseSize || order.specification || "-"} />
                  <Info label="Weight" value={order.purchaseWeightKg ? `${order.purchaseWeightKg.toString()} kg` : "-"} />
                  <Info label="Product cost" value={order.productCostUsd ? money(Number(order.productCostUsd)) : "-"} />
                  <Info label="Freight" value={order.shippingFeeUsd ? money(Number(order.shippingFeeUsd)) : "-"} />
                  <Info label="Service fee" value={order.serviceFeeUsd ? money(Number(order.serviceFeeUsd)) : "-"} />
                  <Info label="Purchase date" value={order.purchaseDate ? order.purchaseDate.toLocaleDateString() : "-"} />
                  <Info label="Budget / quote" value={`${order.budgetUsd ? money(Number(order.budgetUsd)) : "N/A"} / ${order.quoteUsd ? money(Number(order.quoteUsd)) : "-"}`} />
                </div>

                <aside className="rounded-2xl border border-[#dfe7f1] bg-white p-4">
                  <div className="flex items-center gap-2 font-display text-2xl font-black text-[#101828]">
                    <ShoppingCart size={20} />
                    Progress
                  </div>
                  <div className="mt-4 space-y-3">
                    <ProgressRow icon={<ShoppingCart size={16} />} label="Purchasing" status={order.purchaseStatus} />
                    <ProgressRow icon={<PackageCheck size={16} />} label="Warehouse" status={order.warehouseStatus} />
                  </div>
                  {order.purchaseLink ? (
                    <Link href={order.purchaseLink} target="_blank" className="btn-secondary mt-4 w-full rounded-xl px-4 py-2">
                      <ExternalLink size={15} />
                      Purchase link
                    </Link>
                  ) : null}
                </aside>
              </div>

              {(order.adminNote || order.note) ? (
                <div className="border-t border-[#dfe7f1] px-5 py-4 text-sm font-semibold leading-6 text-[#667085]">
                  {order.adminNote ? <p><strong className="text-[#101828]">Agent note:</strong> {order.adminNote}</p> : null}
                  {order.note ? <p className="mt-1"><strong className="text-[#101828]">Your note:</strong> {order.note}</p> : null}
                </div>
              ) : null}
            </article>
          );
        }) : (
          <div className="panel p-8 text-center">
            <h2 className="font-display text-3xl font-black text-[#101828]">No DIY orders yet</h2>
            <p className="mt-2 text-sm font-semibold text-[#667085]">Submit a manual purchasing request for products that need agent help.</p>
            <Link href="/diy-order" className="btn-primary mt-5">Submit DIY order</Link>
          </div>
        )}
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#dfe7f1] bg-[#f8fafc] p-4">
      <div className="text-xs font-extrabold uppercase text-[#98a2b3]">{label}</div>
      <div className="mt-1 break-words font-bold text-[#101828]">{value}</div>
    </div>
  );
}

function ProgressRow({ icon, label, status }: { icon: React.ReactNode; label: string; status: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#dfe7f1] bg-[#f8fafc] px-3 py-2">
      <span className="inline-flex items-center gap-2 text-sm font-bold text-[#667085]">{icon}{label}</span>
      <StatusPill status={status} />
    </div>
  );
}
