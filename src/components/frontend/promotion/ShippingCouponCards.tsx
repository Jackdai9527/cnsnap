import { Globe2, TicketPercent, Truck } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { shippingCoupons } from "@/components/frontend/promotion/promotion-data";

export function ShippingCouponCards() {
  const t = useTranslations("Promotion.shippingCoupons");

  return (
    <section>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="label">{t("eyebrow")}</div>
          <h2 className="mt-2 text-3xl font-black text-[#101828]">{t("title")}</h2>
        </div>
        <p className="max-w-xl text-sm font-semibold leading-6 text-[#667085]">{t("description")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {shippingCoupons.map((coupon) => (
          <Card key={coupon.id} className="overflow-hidden border-[#dfe7f1] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <CardContent className="p-0">
              <div className="grid grid-cols-[112px_1fr]">
                <div className="grid place-items-center bg-[#fff1f2] p-4 text-center">
                  <TicketPercent className="mb-3 text-[#d9142f]" size={26} />
                  <div className="text-2xl font-black text-[#d9142f]">{coupon.discount}</div>
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-[#101828]">{t(coupon.couponNameKey)}</h3>
                    <Badge className="rounded-full bg-[#edf7ff] text-[#0a83ff]">{t("validUntil", { date: coupon.validUntil })}</Badge>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm font-semibold leading-6 text-[#667085]">
                    <InfoLine icon={<Truck size={15} />} label={t("minimum")} value={coupon.minimumShippingFee} />
                    <InfoLine icon={<Globe2 size={15} />} label={t("countries")} value={coupon.applicableCountries} />
                    <InfoLine icon={<TicketPercent size={15} />} label={t("channels")} value={coupon.applicableChannels} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function InfoLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="mt-1 shrink-0 text-[#0a83ff]">{icon}</span>
      <span>
        <strong className="font-black text-[#344054]">{label}:</strong> {value}
      </span>
    </div>
  );
}
