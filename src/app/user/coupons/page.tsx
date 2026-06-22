import { Gift, TicketPercent } from "lucide-react";

const upcomingCoupons = [
  { title: "New campaign coupons", value: "Admin issued", status: "Coming soon", detail: "Activity coupons sent by the operations team will be listed here." },
  { title: "Shipping discount", value: "Logistics", status: "Not issued", detail: "Eligible route or parcel coupons will appear before shipping payment." },
  { title: "Service fee offer", value: "Order checkout", status: "Not issued", detail: "Product order coupons can be applied when the campaign is active." }
];

export default function UserCouponsPage() {
  return (
    <section className="space-y-5">
      <div className="brand-surface rounded-[28px] p-6 md:p-7">
        <div className="label">Activity benefits</div>
        <h1 className="mt-2 font-display text-5xl font-black text-[#101828]">Coupons</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#667085]">
          Coupons issued by the backend campaign team will be shown here with usage status and expiry date.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {upcomingCoupons.map((coupon) => (
          <article key={coupon.title} className="panel overflow-hidden">
            <div className="border-b border-[#dfe7f1] bg-[#fff3f5] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-extrabold uppercase text-[#d9142f]">{coupon.value}</div>
                  <h2 className="mt-2 font-display text-2xl font-black text-[#101828]">{coupon.title}</h2>
                </div>
                <div className="grid size-11 place-items-center rounded-2xl bg-white text-[#d9142f]">
                  <TicketPercent size={21} />
                </div>
              </div>
            </div>
            <div className="p-5">
              <span className="badge">{coupon.status}</span>
              <p className="mt-4 text-sm font-semibold leading-6 text-[#667085]">{coupon.detail}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="panel flex gap-4 p-5">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#eff6ff] text-[#2563eb]">
          <Gift size={20} />
        </div>
        <div>
          <h2 className="font-display text-2xl font-black text-[#101828]">Backend issuance ready area</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#667085]">
            This page is prepared for campaign coupons. To make admin scheduled coupon delivery persistent, add coupon tables and an admin issuance module next.
          </p>
        </div>
      </div>
    </section>
  );
}
