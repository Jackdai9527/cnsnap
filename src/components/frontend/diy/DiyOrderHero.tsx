import Link from "next/link";
import { ClipboardList, ImageIcon, ListChecks, PackageSearch } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";

export async function DiyOrderHero() {
  const t = await getTranslations("DiyOrder.hero");

  return (
    <section className="site-container pt-10 md:pt-14">
      <div className="relative overflow-hidden rounded-[34px] border border-[#dfe7f1] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] md:p-9">
        <div className="absolute right-0 top-0 hidden h-full w-1/2 bg-[linear-gradient(135deg,rgba(217,20,47,0.08),rgba(56,189,248,0.12))] lg:block" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ffd7df] bg-[#fff1f2] px-3 py-1 text-xs font-black uppercase text-[#d9142f]">
              <ClipboardList size={14} />
              {t("eyebrow")}
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-[#101828] md:text-6xl">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-[#667085] md:text-lg">
              {t("subtitle")}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-12 rounded-full bg-[#d9142f] px-6 font-black text-white hover:bg-[#b90f25]">
                <a href="#diy-order-form">
                  <ListChecks size={18} />
                  {t("submit")}
                </a>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-full border-[#dfe7f1] bg-white px-6 font-black text-[#101828]">
                <Link href="/account/diy-orders">
                  <PackageSearch size={18} />
                  {t("viewMine")}
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 rounded-[28px] border border-[#eef2f6] bg-[#fbfdff] p-4">
            {[
              { icon: ImageIcon, title: t("cards.image.title"), description: t("cards.image.description") },
              { icon: ClipboardList, title: t("cards.spec.title"), description: t("cards.spec.description") },
              { icon: PackageSearch, title: t("cards.quote.title"), description: t("cards.quote.description") }
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="flex gap-3 rounded-2xl bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#101828] text-white">
                    <Icon size={18} />
                  </span>
                  <div>
                    <h2 className="text-sm font-black text-[#101828]">{item.title}</h2>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#667085]">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
