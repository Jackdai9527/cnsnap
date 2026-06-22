import { requirePermission } from "@/lib/admin-session";
import { getTranslations } from "next-intl/server";
import { deleteSeoRedirectMock, saveSeoRedirectMock, toggleSeoRedirectMock } from "@/app/admin/seo/actions";
import { SeoRedirectEditorForm } from "@/modules/seo/components/SeoRedirectEditorForm";
import { SeoRedirectsTable } from "@/modules/seo/components/SeoRedirectsTable";
import { getSeoRedirects } from "@/modules/seo/lib/article-store";

export default async function AdminSeoRedirectsPage() {
  await requirePermission("seo.manage");
  const t = await getTranslations("seo.redirectsPage");
  const redirects = await getSeoRedirects();

  return (
    <div className="space-y-6">
      <section className="admin-card p-6">
        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ff1d5e]">{t("kicker")}</div>
        <h1 className="mt-2 text-3xl font-black text-slate-950">{t("title")}</h1>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-slate-500">
          {t("description")}
        </p>
      </section>

      <section className="admin-card p-6">
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950">{t("createTitle")}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{t("createDescription")}</p>
        </div>
        <SeoRedirectEditorForm onSave={saveSeoRedirectMock} />
      </section>

      <SeoRedirectsTable redirects={redirects} onToggle={toggleSeoRedirectMock} onDelete={deleteSeoRedirectMock} />
    </div>
  );
}
