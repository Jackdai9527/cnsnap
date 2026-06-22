import { requirePermission } from "@/lib/admin-session";
import { getTranslations } from "next-intl/server";
import { SeoPagesTable } from "@/modules/seo/components/SeoPagesTable";
import { getSeoPages } from "@/modules/seo/lib/store";
import { updateSeoPageMock } from "@/app/admin/seo/actions";

export default async function AdminSeoPagesPage() {
  await requirePermission("seo.manage");
  const t = await getTranslations("seo.pages");
  const pages = await getSeoPages();

  return (
    <div className="space-y-6">
      <section className="admin-card p-6">
        <div className="flex flex-col gap-2">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ff1d5e]">{t("kicker")}</div>
          <h1 className="text-3xl font-black text-slate-950">{t("title")}</h1>
          <p className="max-w-3xl text-sm font-semibold leading-7 text-slate-500">
            {t("description")}
          </p>
        </div>
      </section>

      <section className="admin-card overflow-hidden p-0">
        <SeoPagesTable pages={pages} onSave={updateSeoPageMock} />
      </section>
    </div>
  );
}
