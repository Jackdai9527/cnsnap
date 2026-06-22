import Link from "next/link";
import { requirePermission } from "@/lib/admin-session";
import { getTranslations } from "next-intl/server";
import { archiveSeoLandingPageMock, deleteSeoLandingPageMock } from "@/app/admin/seo/actions";
import { SeoLandingPagesTable } from "@/modules/seo/components/SeoLandingPagesTable";
import { getSeoLandingPages } from "@/modules/seo/lib/article-store";

export default async function AdminSeoLandingPagesPage() {
  await requirePermission("seo.manage");
  const t = await getTranslations("seo.landingPagesPage");
  const pages = await getSeoLandingPages();

  return (
    <div className="space-y-6">
      <section className="admin-card p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ff1d5e]">{t("kicker")}</div>
            <h1 className="mt-2 text-3xl font-black text-slate-950">{t("title")}</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-slate-500">
              {t("description")}
            </p>
          </div>
          <Link href="/admin/seo/landing-pages/new" className="admin-primary rounded-full px-5 py-2.5 text-sm">{t("new")}</Link>
        </div>
      </section>

      <SeoLandingPagesTable pages={pages} onArchive={archiveSeoLandingPageMock} onDelete={deleteSeoLandingPageMock} />
    </div>
  );
}
