import { requirePermission } from "@/lib/admin-session";
import { getTranslations } from "next-intl/server";
import { getSeoIndexPolicy } from "@/modules/seo/lib/index-policy";
import { getSeoSitemapRobotsSnapshot } from "@/modules/seo/lib/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminSeoSitemapRobotsPage() {
  await requirePermission("seo.manage");
  const t = await getTranslations("seo.sitemapRobotsPage");
  const snapshot = await getSeoSitemapRobotsSnapshot();

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

      <section className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <article className="admin-card p-6">
          <h2 className="text-xl font-black text-slate-950">{t("robotsRules")}</h2>
          <div className="mt-4 grid gap-3">
            {snapshot.robotsRules.map((rule) => (
              <div key={rule.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{rule.pathPattern}</div>
                    <div className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{rule.userAgent}</div>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${rule.ruleType === "disallow" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                    {rule.ruleType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-card overflow-hidden p-0">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="px-4 py-3 font-black text-slate-600">{t("table.path")}</TableHead>
                <TableHead className="px-4 py-3 font-black text-slate-600">{t("table.enabled")}</TableHead>
                <TableHead className="px-4 py-3 font-black text-slate-600">{t("table.changeFrequency")}</TableHead>
                <TableHead className="px-4 py-3 font-black text-slate-600">{t("table.priority")}</TableHead>
                <TableHead className="px-4 py-3 font-black text-slate-600">{t("table.indexPolicy")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshot.sitemapEntries.map((entry) => {
                const policy = getSeoIndexPolicy(entry.path);
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="px-4 py-4 font-black text-slate-950">{entry.path}</TableCell>
                    <TableCell className="px-4 py-4 text-sm font-bold text-slate-700">{entry.enabled ? t("table.yes") : t("table.no")}</TableCell>
                    <TableCell className="px-4 py-4 text-sm font-bold capitalize text-slate-700">{entry.changeFrequency}</TableCell>
                    <TableCell className="px-4 py-4 text-sm font-bold text-slate-700">{entry.priority.toFixed(1)}</TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="text-sm font-bold text-slate-900">{policy.robots}</div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">
                        {policy.includeInSitemap ? t("table.included") : t("table.excluded")}{policy.reason ? ` - ${policy.reason}` : ""}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow>
                <TableCell className="px-4 py-4 font-black text-slate-950">{t("table.temporaryProductPages")}</TableCell>
                <TableCell className="px-4 py-4 text-sm font-bold text-slate-700">{t("table.no")}</TableCell>
                <TableCell className="px-4 py-4 text-sm font-bold text-slate-700">{t("table.na")}</TableCell>
                <TableCell className="px-4 py-4 text-sm font-bold text-slate-700">0.0</TableCell>
                <TableCell className="px-4 py-4 text-sm font-semibold text-slate-500">noindex,nofollow - excluded by policy</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="px-4 py-4 font-black text-slate-950">{t("table.searchPages")}</TableCell>
                <TableCell className="px-4 py-4 text-sm font-bold text-slate-700">{t("table.no")}</TableCell>
                <TableCell className="px-4 py-4 text-sm font-bold text-slate-700">{t("table.na")}</TableCell>
                <TableCell className="px-4 py-4 text-sm font-bold text-slate-700">0.0</TableCell>
                <TableCell className="px-4 py-4 text-sm font-semibold text-slate-500">noindex,follow - excluded by policy</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </article>
      </section>
    </div>
  );
}
