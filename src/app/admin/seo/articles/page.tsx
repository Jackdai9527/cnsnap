import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/lib/admin-session";
import { getSeoArticleCategories, getSeoArticles } from "@/modules/seo/lib/article-store";
import { archiveSeoArticleMock, deleteSeoArticleMock } from "@/app/admin/seo/actions";
import { SeoArticlesTable } from "@/modules/seo/components/SeoArticlesTable";

export default async function AdminSeoArticlesPage() {
  await requirePermission("seo.manage");
  const t = await getTranslations("seo.articles");
  const [articles, categories] = await Promise.all([getSeoArticles(), getSeoArticleCategories()]);

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
          <Link href="/admin/seo/articles/new" className="admin-primary rounded-full px-5 py-2.5 text-sm">{t("newArticle")}</Link>
        </div>
      </section>

      <SeoArticlesTable articles={articles} categories={categories} onArchive={archiveSeoArticleMock} onDelete={deleteSeoArticleMock} />
    </div>
  );
}
