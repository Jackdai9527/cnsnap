import Link from "next/link";
import { ArrowRight, LifeBuoy, MessageSquarePlus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";

export async function TicketsCenterCta() {
  const t = await getTranslations("HelpCenter.ticketsCta");

  return (
    <section className="site-container py-10">
      <div className="rounded-[30px] bg-[#101828] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-white">
              <LifeBuoy size={22} />
            </div>
            <div>
              <h2 className="text-3xl font-black">{t("title")}</h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/72">{t("description")}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-11 rounded-full bg-white px-5 font-black text-[#101828] hover:bg-[#f8fafc]">
              <Link href="/account/tickets">
                {t("open")}
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-full border-white/25 bg-white/10 px-5 font-black text-white hover:bg-white/15">
              <Link href="/account/tickets/new?category=other">
                <MessageSquarePlus size={17} />
                {t("create")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
