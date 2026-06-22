import { getTranslations } from "next-intl/server";
import { updateSettingsBatch } from "../actions";
import { HtmlEditor } from "@/components/admin/HtmlEditor";
import { AdminSaveForm } from "@/components/admin/AdminSaveForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { footerSectionSettings } from "@/lib/footer-settings";
import { getFooterContentBlocks } from "@/lib/frontend-content-blocks";
import { getEnabledFrontendLocaleConfigsRuntime } from "@/lib/i18n/locale-config-store";

export default async function AdminFooterPage() {
  const t = await getTranslations("footer");
  const [blocks, locales] = await Promise.all([getFooterContentBlocks(), getEnabledFrontendLocaleConfigsRuntime()]);
  const blockMap = new Map(blocks.map((block) => [block.blockKey, block]));

  return (
    <section>
      <div className="mb-5">
        <div className="text-sm font-semibold text-slate-500">{t("page.kicker")}</div>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">{t("page.title")}</h1>
      </div>

      <div className="mb-5 rounded-2xl border border-[#465fff]/20 bg-[#eef4ff] p-5 text-sm leading-6 text-slate-700">
        {t("page.description")}
      </div>

      <AdminSaveForm action={updateSettingsBatch} permission="footer.manage" className="admin-card p-5" submitLabel={t("page.save")}>
        <input type="hidden" name="settingKey" value="__footer_content_blocks__" />
        <div className="grid gap-7">
        {footerSectionSettings.map(([key, defaultValue, label, description]) => {
          const block = blockMap.get(key);
          return (
            <section key={key}>
              <div className="mb-3">
                <div className="font-black text-slate-900">{label}</div>
                <div className="text-xs text-slate-400">{key}</div>
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              </div>
              <Tabs defaultValue={locales[0]?.locale} className="gap-4">
                <TabsList variant="line" className="flex flex-wrap">
                  {locales.map((locale) => {
                    const translation = block?.translations[locale.locale];
                    const status = translation?.translationStatus || "missing";
                    return (
                      <TabsTrigger key={locale.locale} value={locale.locale} className="gap-2 px-3 py-2">
                        <span>{locale.nativeName}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] ${
                          status === "published"
                            ? "bg-emerald-100 text-emerald-700"
                            : status === "translated"
                              ? "bg-sky-100 text-sky-700"
                              : status === "needs_review"
                                ? "bg-amber-100 text-amber-700"
                                : status === "draft"
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-rose-100 text-rose-700"
                        }`}>
                          {status}
                        </span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {locales.map((locale) => {
                  const translation = block?.translations[locale.locale];
                  return (
                    <TabsContent key={locale.locale} value={locale.locale} className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-[180px_1fr] md:items-center">
                        <label className="text-sm font-bold text-slate-700">{locale.nativeName}</label>
                        <select
                          name={`translationStatus:${key}:${locale.locale}`}
                          defaultValue={translation?.translationStatus || (locale.locale === "en" ? "published" : "missing")}
                          className="admin-input h-10"
                        >
                          <option value="missing">missing</option>
                          <option value="draft">draft</option>
                          <option value="translated">translated</option>
                          <option value="needs_review">needs_review</option>
                          <option value="published">published</option>
                        </select>
                      </div>
                      <HtmlEditor
                        name={`content:${key}:${locale.locale}`}
                        defaultValue={translation?.content ?? (locale.locale === "en" ? defaultValue : "")}
                        minHeight={180}
                      />
                    </TabsContent>
                  );
                })}
              </Tabs>
            </section>
          );
        })}
        </div>
      </AdminSaveForm>
    </section>
  );
}
