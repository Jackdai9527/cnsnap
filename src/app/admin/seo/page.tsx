import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Activity, FileCheck2, FileSearch2, Files, GitBranch, Globe, LayoutTemplate, LockKeyhole, Map, MessagesSquare, ShieldBan, Tags, TriangleAlert, Waypoints } from "lucide-react";
import { requirePermission } from "@/lib/admin-session";
import { getSeoDashboardSummary, getSeoPages } from "@/modules/seo/lib/store";

const statCards = [
  { key: "indexedPages", icon: FileCheck2 },
  { key: "noindexPages", icon: LockKeyhole },
  { key: "pagesMissingTitle", icon: Tags },
  { key: "pagesMissingDescription", icon: FileSearch2 },
  { key: "sitemapUrls", icon: Map },
  { key: "robotsDisallowRules", icon: ShieldBan },
  { key: "temporaryProductPagesNoindex", icon: Waypoints },
  { key: "searchPagesNoindex", icon: Activity },
  { key: "publishedArticles", icon: Files },
  { key: "draftArticles", icon: FileSearch2 },
  { key: "scheduledArticles", icon: MessagesSquare },
  { key: "archivedArticles", icon: LockKeyhole },
  { key: "articlesMissingSeoTitle", icon: Tags },
  { key: "articlesMissingMetaDescription", icon: FileSearch2 },
  { key: "articlesWithoutFaq", icon: MessagesSquare },
  { key: "articlesWithoutCta", icon: Activity },
  { key: "publishedLandingPages", icon: LayoutTemplate },
  { key: "draftLandingPages", icon: FileSearch2 },
  { key: "platformLandingPages", icon: Globe },
  { key: "shippingCountryLandingPages", icon: Globe },
  { key: "campaignLandingPages", icon: LayoutTemplate },
  { key: "landingPagesMissingFaq", icon: MessagesSquare },
  { key: "landingPagesMissingCta", icon: Activity },
  { key: "redirectRules", icon: GitBranch },
  { key: "enabledRedirects", icon: GitBranch },
  { key: "disabledRedirects", icon: GitBranch },
  { key: "redirectHits", icon: Activity },
  { key: "seoErrors", icon: TriangleAlert },
  { key: "seoWarnings", icon: TriangleAlert },
  { key: "seoNotices", icon: TriangleAlert },
  { key: "missingTitles", icon: Tags },
  { key: "missingDescriptions", icon: FileSearch2 },
  { key: "sitemapConflicts", icon: Map }
] as const;

export default async function AdminSeoDashboardPage() {
  await requirePermission("seo.manage");
  const t = await getTranslations("seo.dashboard");
  const [summary, pages] = await Promise.all([getSeoDashboardSummary(), getSeoPages()]);

  return (
    <div className="space-y-6">
      <section className="admin-card overflow-hidden p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ff1d5e]">{t("kicker")}</div>
            <h1 className="mt-2 text-3xl font-black text-slate-950">{t("title")}</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-slate-500">
              {t("description")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/seo/articles" className="admin-primary rounded-full px-5 py-2.5 text-sm">{t("actions.manageArticles")}</Link>
            <Link href="/admin/seo/landing-pages" className="admin-primary rounded-full px-5 py-2.5 text-sm">{t("actions.manageLandingPages")}</Link>
            <Link href="/admin/seo/pages" className="admin-primary rounded-full px-5 py-2.5 text-sm">{t("actions.managePages")}</Link>
            <Link href="/admin/seo/languages" className="admin-primary rounded-full px-5 py-2.5 text-sm">{t("actions.seoLanguages")}</Link>
            <Link href="/admin/seo/redirects" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:text-slate-950">
              {t("actions.redirects")}
            </Link>
            <Link href="/admin/seo/audit" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:text-slate-950">
              {t("actions.audit")}
            </Link>
            <Link href="/admin/seo/settings" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:text-slate-950">
              {t("actions.settings")}
            </Link>
            <Link href="/admin/seo/sitemap-robots" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:text-slate-950">
              {t("actions.sitemapRobots")}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = summary[card.key];
          return (
            <article key={card.key} className="admin-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{t(`stats.${card.key}`)}</div>
                  <div className="mt-3 text-3xl font-black text-slate-950">{String(value)}</div>
                </div>
                <span className="grid size-11 place-items-center rounded-2xl bg-[#fff1f6] text-[#ff1d5e]">
                  <Icon size={18} />
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="admin-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-950">{t("panels.latestArticles")}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">{t("panels.latestArticlesDesc")}</p>
          </div>
          <Link href="/admin/seo/articles" className="text-sm font-black text-[#ff1d5e]">{t("panels.openArticles")}</Link>
        </div>

        <div className="mt-5 grid gap-3">
          {summary.latestPublishedArticles.map((article) => (
            <div key={article.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-black text-slate-950">{article.title}</div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{article.category}</div>
                </div>
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
                  <span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("en-US") : "-"}</span>
                  <Link href={`/blog/${article.slug}`} target="_blank" className="text-[#ff1d5e]">{t("states.preview")}</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="admin-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-950">{t("panels.latestLandingPages")}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">{t("panels.latestLandingPagesDesc")}</p>
            </div>
            <Link href="/admin/seo/landing-pages" className="text-sm font-black text-[#ff1d5e]">{t("panels.openLandingPages")}</Link>
          </div>

          <div className="mt-5 grid gap-3">
            {summary.latestLandingPages.map((page) => (
              <div key={page.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-sm font-black text-slate-950">{page.title}</div>
                    <div className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{page.type}</div>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
                    <span>{page.path}</span>
                    <Link href={page.path} target="_blank" className="text-[#ff1d5e]">{t("states.preview")}</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-950">{t("panels.latestIssues")}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">{t("panels.latestIssuesDesc")}</p>
            </div>
            <Link href="/admin/seo/audit" className="text-sm font-black text-[#ff1d5e]">{t("panels.openAudit")}</Link>
          </div>

          <div className="mt-5 grid gap-3">
            {summary.latestSeoIssues.map((issue) => (
              <div key={issue.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-sm font-black text-slate-950">{issue.entityLabel}</div>
                    <div className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{issue.rule}</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-500">{issue.severity}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="admin-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-950">{t("panels.latestRedirects")}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">{t("panels.latestRedirectsDesc")}</p>
          </div>
          <Link href="/admin/seo/redirects" className="text-sm font-black text-[#ff1d5e]">{t("panels.openRedirects")}</Link>
        </div>

        <div className="mt-5 grid gap-3">
          {summary.latestRedirectRules.map((redirect) => (
            <div key={redirect.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-black text-slate-950">{redirect.fromPath}</div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{redirect.toPath}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
                  <span>{redirect.statusCode}</span>
                  <span>{redirect.enabled ? t("states.enabled") : t("states.disabled")}</span>
                  <span>{redirect.hitCount} {t("states.hits")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-950">{t("panels.pageHealth")}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">{t("panels.pageHealthDesc")}</p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            {t("panels.lastUpdated")} {new Date(summary.lastUpdated).toLocaleString("en-US")}
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {pages.map((page) => (
            <div key={page.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-black text-slate-950">{page.path}</div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{page.pageType}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill label={page.status} tone={statusTone(page.status)} />
                  <StatusPill label={page.indexPolicy.robots} tone={page.indexPolicy.allowIndex ? "good" : "locked"} />
                  <StatusPill label={page.includeInSitemap ? t("states.inSitemap") : t("states.excludedFromSitemap")} tone={page.includeInSitemap ? "good" : "muted"} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "good" | "warn" | "locked" | "muted" }) {
  const toneClass =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : tone === "locked"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-slate-200 bg-white text-slate-600";

  return <span className={`rounded-full border px-3 py-1 text-xs font-black ${toneClass}`}>{label}</span>;
}

function statusTone(status: string): "good" | "warn" | "locked" | "muted" {
  if (status === "Good") return "good";
  if (status === "Locked Noindex") return "locked";
  if (status === "Disabled") return "muted";
  return "warn";
}
