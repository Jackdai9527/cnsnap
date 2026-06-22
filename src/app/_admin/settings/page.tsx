import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AdminSaveForm } from "@/components/admin/AdminSaveForm";
import { generalSettingGroups, generalSettingKeys } from "@/lib/admin-settings";
import { prisma } from "@/lib/db";
import { updateSettingsBatch } from "../actions";

export default async function AdminSettingsPage() {
  const t = await getTranslations("settings.generalPage");
  const settings = await prisma.setting.findMany({
    where: { key: { in: generalSettingKeys } },
    orderBy: { key: "asc" }
  });
  const map = new Map(settings.map((setting) => [setting.key, setting]));

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="admin-kicker">{t("kicker")}</div>
          <h1 className="admin-page-title mt-1">{t("title")}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            {t("description")}
          </p>
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <Link href="/admin/settings/api" className="admin-card p-4 text-sm font-bold text-slate-700 hover:border-[#465fff] hover:text-[#465fff]">{t("links.apiSettings")}</Link>
        <Link href="/admin/settings/smtp" className="admin-card p-4 text-sm font-bold text-slate-700 hover:border-[#465fff] hover:text-[#465fff]">{t("links.smtpSettings")}</Link>
        <Link href="/admin/shipping/channels" className="admin-card p-4 text-sm font-bold text-slate-700 hover:border-[#465fff] hover:text-[#465fff]">{t("links.shippingChannels")}</Link>
        <Link href="/admin/content/help-articles" className="admin-card p-4 text-sm font-bold text-slate-700 hover:border-[#465fff] hover:text-[#465fff]">{t("links.helpArticles")}</Link>
      </div>

      <AdminSaveForm action={updateSettingsBatch} permission="settings.manage" className="admin-card p-5" submitLabel={t("save")}>
        <div className="grid gap-7">
        {generalSettingGroups.map((group) => (
          <section key={group.title} id={group.title === "Payment - ONLYPAY" ? "payment-onlypay" : undefined} className="scroll-mt-24">
            <div className="mb-4">
              <h2 className="text-lg font-black text-slate-900">{group.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{group.description}</p>
            </div>
            <div className="admin-table-wrap shadow-none">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t("setting")}</th>
                    <th>{t("value")}</th>
                  </tr>
                </thead>
                <tbody>
                  {group.settings.map(([key, defaultValue, label, description]) => {
                    const setting = map.get(key);
                    const defaultValueText = String(defaultValue);
                    const isBoolean = defaultValueText === "true" || defaultValueText === "false";
                    const secret = key.includes("secret");
                    return (
                      <tr key={key}>
                        <td>
                          <input type="hidden" name="settingKey" value={key} />
                          <input type="hidden" name={`label:${key}`} value={label} />
                          <input type="hidden" name={`description:${key}`} value={description} />
                          <div className="font-bold text-slate-900">{label}</div>
                          <div className="mt-1 text-xs text-slate-400">{key}</div>
                          <p className="mt-1 text-xs text-slate-500">{description}</p>
                        </td>
                        <td className="min-w-[280px]">
                          {isBoolean ? (
                            <select name={`value:${key}`} defaultValue={setting?.value ?? defaultValueText} className="admin-input w-full max-w-sm">
                              <option value="true">true</option>
                              <option value="false">false</option>
                            </select>
                          ) : (
                            <input name={`value:${key}`} defaultValue={setting?.value ?? defaultValueText} className="admin-input w-full max-w-sm" type={secret ? "password" : "text"} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
        </div>
      </AdminSaveForm>
    </section>
  );
}
