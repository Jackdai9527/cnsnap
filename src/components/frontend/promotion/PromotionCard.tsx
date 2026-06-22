import Link from "next/link";
import { ArrowRight, CalendarDays, Gift } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PromotionOffer } from "@/components/frontend/promotion/promotion-data";

const toneClasses = {
  red: "bg-[#fff1f2] text-[#d9142f] border-[#ffd7df]",
  blue: "bg-[#edf7ff] text-[#0a83ff] border-[#d9e7ff]",
  green: "bg-[#ecfdf3] text-[#027a48] border-[#bbf7d0]"
};

export function PromotionCard({ offer }: { offer: PromotionOffer }) {
  const t = useTranslations("Promotion");

  return (
    <Card className="group border-[#dfe7f1] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <span className={cn("grid size-12 place-items-center rounded-2xl border", toneClasses[offer.tone])}>
            <Gift size={21} />
          </span>
          <Badge className={cn("rounded-full border px-3 py-1 font-black", toneClasses[offer.tone])}>{offer.rewardValue}</Badge>
        </div>
        <h3 className="mt-5 text-xl font-black leading-tight text-[#101828]">{t(offer.titleKey)}</h3>
        <p className="mt-3 min-h-12 text-sm font-semibold leading-6 text-[#667085]">{t(offer.descriptionKey)}</p>
        <div className="mt-5 flex items-center gap-2 text-xs font-black text-[#667085]">
          <CalendarDays size={14} />
          {t("common.validUntil", { date: offer.validUntil })}
        </div>
        <Button asChild variant="outline" className="mt-5 h-10 w-full rounded-full font-black group-hover:border-[#d9142f] group-hover:text-[#d9142f]">
          <Link href={offer.actionHref}>
            {t(offer.actionTextKey)}
            <ArrowRight size={15} />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
