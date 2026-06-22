import { prisma } from "@/lib/db";
import { money } from "@/lib/currency";
import { getCurrentUser } from "@/lib/session";
import { StatusPill } from "@/components/ui/StatusPill";

export default async function UserPackagesPage() {
  const user = await getCurrentUser();
  const packages = await prisma.package.findMany({ where: { userId: user?.id }, include: { shippingChannel: true, order: true }, orderBy: { createdAt: "desc" } });
  return (
    <section>
      <div className="brand-surface mb-5 rounded-[28px] p-6"><div className="label">Warehouse parcels</div><h1 className="mt-2 font-display text-5xl font-black">Packages</h1></div>
      <div className="space-y-3">
        {packages.map((pkg) => (
          <div key={pkg.id} className="panel grid gap-3 p-5 transition hover:-translate-y-1 hover:border-[#0a83ff] hover:shadow-[0_22px_52px_rgba(10,131,255,0.14)] md:grid-cols-[1fr_auto]">
            <div>
              <div className="font-semibold">{pkg.packageNo}</div>
              <div className="mt-2 flex flex-wrap gap-2"><StatusPill status={pkg.status} /><span className="badge">{pkg.weightKg.toString()} kg</span><span className="badge">{pkg.shippingChannel?.name ?? "No channel"}</span></div>
            </div>
            <div className="font-display text-3xl font-black text-[#e60012]">{money(Number(pkg.shippingFeeUsd))}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
