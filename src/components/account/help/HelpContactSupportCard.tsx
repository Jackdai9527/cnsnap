import Link from "next/link";
import { ArrowRight, LifeBuoy, MessageSquarePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function HelpContactSupportCard() {
  const t = useTranslations("HelpCenter.ticketsCta");

  return (
    <Card className="overflow-hidden border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <CardContent className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-pink-200 bg-pink-50 text-pink-600">
            <LifeBuoy className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950">{t("title")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {t("description")}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row md:justify-end">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/account/tickets">
              {t("open")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link href="/account/tickets/new?category=other">
              <MessageSquarePlus className="size-4" />
              {t("create")}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
