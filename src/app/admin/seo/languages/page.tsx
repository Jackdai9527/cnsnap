import { getTranslations } from "next-intl/server";
import { AdminDataPage } from "@/components/admin/modules/AdminDataPage";
import { AdminSaveForm } from "@/components/admin/AdminSaveForm";
import { requirePermission } from "@/lib/admin-session";
import { getLocaleConfigsSnapshot } from "@/lib/i18n/locale-config-store";
import { updateSeoLocaleConfigMock } from "@/app/admin/seo/actions";

export default async function AdminSeoLanguagesPage() {
  await requirePermission("seo.manage");
  const t = await getTranslations("seo.languages");
  const table = await getTranslations("seo.languagesTable");
  const states = await getTranslations("seo.tables.states");
  const localeConfigs = await getLocaleConfigsSnapshot();

  return (
    <section className="space-y-6">
      <AdminDataPage
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
        countLabel={t("count", { count: localeConfigs.length })}
        columns={[
          { key: "locale", label: table("columns.locale") },
          { key: "name", label: table("columns.name") },
          { key: "nativeName", label: table("columns.nativeName") },
          { key: "enabled", label: table("columns.enabled") },
          { key: "adminEnabled", label: table("columns.adminEnabled") },
          { key: "frontendEnabled", label: table("columns.frontendEnabled") },
          { key: "seoEnabled", label: table("columns.seoEnabled") },
          { key: "default", label: table("columns.default") },
          { key: "sortOrder", label: table("columns.sortOrder") }
        ]}
        rows={localeConfigs.map((locale) => ({
          id: locale.locale,
          cells: {
            locale: locale.locale,
            name: locale.name,
            nativeName: locale.nativeName,
            enabled: locale.enabled ? states("yes") : states("no"),
            adminEnabled: locale.adminEnabled ? states("yes") : states("no"),
            frontendEnabled: locale.frontendEnabled ? states("yes") : states("no"),
            seoEnabled: locale.seoEnabled ? states("yes") : states("no"),
            default: locale.isDefault ? states("yes") : states("no"),
            sortOrder: String(locale.sortOrder)
          },
          detail: [
            [table("details.locale"), locale.locale],
            [table("details.englishName"), locale.name],
            [table("details.nativeName"), locale.nativeName],
            [table("details.enabled"), locale.enabled ? states("yes") : states("no")],
            [table("details.adminEnabled"), locale.adminEnabled ? states("yes") : states("no")],
            [table("details.frontendEnabled"), locale.frontendEnabled ? states("yes") : states("no")],
            [table("details.seoEnabled"), locale.seoEnabled ? states("yes") : states("no")],
            [table("details.defaultLocale"), locale.isDefault ? states("yes") : states("no")],
            [table("details.sortOrder"), String(locale.sortOrder)]
          ]
        }))}
        emptyText={t("empty")}
      />

      <section className="admin-card p-6">
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950">{t("runtimeTitle")}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{t("runtimeDescription")}</p>
        </div>
        <div className="grid gap-4">
          {localeConfigs.map((locale) => (
            <AdminSaveForm key={locale.locale} action={updateSeoLocaleConfigMock} className="rounded-2xl border border-slate-200 bg-slate-50 p-4" submitLabel={t("saveLocale")} hideFooter>
              <input type="hidden" name="locale" value={locale.locale} />
              <div className="grid gap-4 xl:grid-cols-[220px_repeat(4,140px)_120px] xl:items-center">
                <div>
                  <div className="font-black text-slate-950">{locale.nativeName}</div>
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{locale.locale}</div>
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" name="enabled" defaultChecked={locale.enabled} />
                  {t("flags.global")}
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" name="frontendEnabled" defaultChecked={locale.frontendEnabled} />
                  {t("flags.frontend")}
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" name="seoEnabled" defaultChecked={locale.seoEnabled} />
                  {t("flags.seo")}
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" name="isDefault" defaultChecked={locale.isDefault} disabled={locale.locale === "en"} />
                  {t("flags.default")}
                </label>
                <input name="sortOrder" type="number" defaultValue={locale.sortOrder} className="admin-input h-10" />
                <button className="admin-primary px-4 py-2 text-sm">{t("save")}</button>
              </div>
            </AdminSaveForm>
          ))}
        </div>
      </section>
    </section>
  );
}
