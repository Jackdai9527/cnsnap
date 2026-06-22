import Link from "next/link";
import { ArrowRight, BadgeDollarSign, CircleDollarSign, Target, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function AffiliateRewardCard() {
  const t = useTranslations("Promotion.affiliate");
  const metrics = [
    { icon: BadgeDollarSign, label: t("metrics.rate"), value: "3%" },
    { icon: Target, label: t("metrics.requirement"), value: "$30+" },
    { icon: CircleDollarSign, label: t("metrics.payout"), value: "Wallet" },
    { icon: Users, label: t("metrics.minimum"), value: "$20" }
  ];

  return (
    <Card className="overflow-hidden border-[#dfe7f1] bg-white shadow-[0_22px_60px_rgba(15,23,42,0.06)]">
      <CardContent className="grid gap-0 p-0 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-[#101828] p-6 text-white md:p-7">
          <div className="grid size-12 place-items-center rounded-2xl bg-white text-[#d9142f]">
            <Users size={22} />
          </div>
          <h2 className="mt-5 text-3xl font-black">{t("title")}</h2>
          <p className="mt-3 text-sm font-semibold leading-7 text-white/72">{t("description")}</p>
          <Button asChild className="mt-6 h-11 rounded-full bg-white px-5 font-black text-[#101828] hover:bg-[#f8fafc]">
            <Link href="/account/affiliate">
              {t("join")}
              <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 md:p-6">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div key={metric.label} className="rounded-2xl border border-[#eef2f6] bg-[#fbfdff] p-4">
                <div className="grid size-10 place-items-center rounded-2xl bg-[#fff1f2] text-[#d9142f]">
                  <Icon size={18} />
                </div>
                <div className="mt-4 text-sm font-black text-[#667085]">{metric.label}</div>
                <div className="mt-1 text-2xl font-black text-[#101828]">{metric.value}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
