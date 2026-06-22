import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { limitedCampaigns } from "@/components/frontend/promotion/promotion-data";

export function LimitedCampaignCards() {
  const t = useTranslations("Promotion.campaigns");

  return (
    <section>
      <div className="mb-5">
        <div className="label">{t("eyebrow")}</div>
        <h2 className="mt-2 text-3xl font-black text-[#101828]">{t("title")}</h2>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#667085]">{t("description")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {limitedCampaigns.map((campaign) => (
          <Card key={campaign.id} className="border-[#dfe7f1] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-[#101828] text-white">
                  <CalendarClock size={20} />
                </span>
                <Badge className={campaign.campaignStatus === "active" ? "rounded-full bg-[#ecfdf3] text-[#027a48]" : "rounded-full bg-[#fffbeb] text-[#b54708]"}>
                  {t(`status.${campaign.campaignStatus}`)}
                </Badge>
              </div>
              <h3 className="mt-5 text-xl font-black text-[#101828]">{t(campaign.campaignTitleKey)}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{t(campaign.campaignDescriptionKey)}</p>
              <div className="mt-4 rounded-2xl bg-[#f8fafc] p-3 text-sm font-bold text-[#667085]">
                {campaign.startAt} - {campaign.endAt}
              </div>
              <Button asChild variant="outline" className="mt-5 h-10 rounded-full font-black">
                <Link href={campaign.actionHref}>
                  {t("view")}
                  <ArrowRight size={15} />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
