import { getTranslations } from "next-intl/server";
import { updateSettingsBatch } from "../actions";
import { AdminSaveForm } from "@/components/admin/AdminSaveForm";
import { authSettingGroups, ensureAuthSettings } from "@/lib/auth-settings";
import { prisma } from "@/lib/db";

export default async function AdminAuthSettingsPage() {
  const t = await getTranslations("auth.page");
  await ensureAuthSettings();
  const settings = await prisma.setting.findMany({
    where: { key: { in: authSettingGroups.flatMap((group) => group.settings.map(([key]) => key)) } },
    orderBy: { key: "asc" }
  });
  const map = new Map(settings.map((setting) => [setting.key, setting]));

  return (
    <section>
      <div className="mb-5">
        <div className="text-sm font-semibold text-slate-500">{t("kicker")}</div>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">{t("title")}</h1>
      </div>

      <div className="mb-5 rounded-2xl border border-[#465fff]/20 bg-[#eef4ff] p-5 text-sm leading-6 text-slate-700">
        {t("description")}
      </div>

      <AdminSaveForm action={updateSettingsBatch} permission="settings.manage" className="admin-card p-5" submitLabel={t("save")}>
        <div className="grid gap-7">
        {authSettingGroups.map((group) => (
          <section key={group.id}>
            <div className="mb-4">
              <h2 className="text-xl font-black text-slate-900">{t(`groups.${group.id}.title`)}</h2>
              <p className="mt-1 text-sm text-slate-500">{t(`groups.${group.id}.description`)}</p>
            </div>
            <div className="grid gap-3">
              {group.settings.map(([key, defaultValue, label, description]) => {
                const setting = map.get(key);
                const isBoolean = defaultValue === "true" || defaultValue === "false";
                const secret = key.includes("secret") || key.includes("server");
                const translatedLabel = t(`fields.${key}.label`);
                const translatedDescription = t(`fields.${key}.description`);
                return (
                  <div key={key} className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 md:grid-cols-[1fr_360px]">
                    <div>
                      <input type="hidden" name="settingKey" value={key} />
                      <input type="hidden" name={`label:${key}`} value={label} />
                      <input type="hidden" name={`description:${key}`} value={description} />
                      <div className="font-semibold text-slate-900">{translatedLabel}</div>
                      <div className="text-xs text-slate-400">{key}</div>
                      <div className="mt-1 text-xs text-slate-500">{translatedDescription}</div>
                    </div>
                    <div>
                      {isBoolean ? (
                        <select name={`value:${key}`} defaultValue={setting?.value ?? defaultValue} className="admin-input w-full">
                          <option value="true">{t("boolean.true")}</option>
                          <option value="false">{t("boolean.false")}</option>
                        </select>
                      ) : (
                        <input name={`value:${key}`} defaultValue={setting?.value ?? defaultValue} className="admin-input w-full" type={secret ? "password" : "text"} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        </div>
      </AdminSaveForm>
    </section>
  );
}
