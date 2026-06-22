import { AlertTriangle, CircleAlert, Info } from "lucide-react";
import { requirePermission } from "@/lib/admin-session";
import { getTranslations } from "next-intl/server";
import { SeoAuditIssuesTable } from "@/modules/seo/components/SeoAuditIssuesTable";
import { getSeoAuditIssues, getSeoAuditSummary } from "@/modules/seo/lib/audit";

const cards = [
  { key: "errors", labelKey: "errors", icon: CircleAlert, className: "bg-rose-50 text-rose-700" },
  { key: "warnings", labelKey: "warnings", icon: AlertTriangle, className: "bg-amber-50 text-amber-700" },
  { key: "notices", labelKey: "notices", icon: Info, className: "bg-sky-50 text-sky-700" },
  { key: "missingTitles", labelKey: "missingTitles", icon: CircleAlert, className: "bg-slate-100 text-slate-700" },
  { key: "missingDescriptions", labelKey: "missingDescriptions", icon: AlertTriangle, className: "bg-slate-100 text-slate-700" },
  { key: "sitemapConflicts", labelKey: "sitemapConflicts", icon: Info, className: "bg-slate-100 text-slate-700" }
] as const;

export default async function AdminSeoAuditPage() {
  await requirePermission("seo.manage");
  const t = await getTranslations("seo.auditPage");
  const cardsT = await getTranslations("seo.dashboard.cards");
  const [summary, issues] = await Promise.all([getSeoAuditSummary(), getSeoAuditIssues()]);

  return (
    <div className="space-y-6">
      <section className="admin-card p-6">
        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ff1d5e]">{t("kicker")}</div>
        <h1 className="mt-2 text-3xl font-black text-slate-950">{t("title")}</h1>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-slate-500">
          {t("description")}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const value = summary[card.key];
          return (
            <article key={card.key} className="admin-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{cardsT(card.labelKey)}</div>
                  <div className="mt-3 text-3xl font-black text-slate-950">{String(value)}</div>
                </div>
                <span className={`grid size-11 place-items-center rounded-2xl ${card.className}`}>
                  <Icon size={18} />
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <SeoAuditIssuesTable issues={issues} />
    </div>
  );
}
