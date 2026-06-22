import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminSaveForm } from "@/components/admin/AdminSaveForm";
import { HtmlEditor } from "@/components/admin/HtmlEditor";
import { AdminDataPageTable, type AdminDataTableRow } from "@/components/admin/modules/AdminDataPageTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusPill } from "@/components/ui/StatusPill";
import { getHelpArticleEditorSnapshot } from "@/lib/content-localization";
import { deleteHelpArticle, upsertHelpArticle } from "../actions";

export default async function AdminHelpPage() {
  const t = await getTranslations("help");
  const { articles, locales } = await getHelpArticleEditorSnapshot();
  const sortedArticles = sortHelpArticles(articles);
  const tableRows: AdminDataTableRow[] = sortedArticles.map((article) => ({
    id: String(article.id),
    cells: {
      title: (
        <div>
          <div className="font-bold text-slate-900">{article.title}</div>
          <div className="max-w-[360px] truncate text-xs text-slate-400">{article.excerpt}</div>
        </div>
      ),
      category: article.category,
      slug: <Link href={`/help/${article.slug}`} className="text-[#465fff]" target="_blank">/help/{article.slug}</Link>,
      locale: article.locale,
      status: <StatusPill status={article.isPublished ? "published" : "draft"} />,
      updated: article.updatedAt.toLocaleDateString(),
      actions: (
        <div className="flex gap-2">
          <Link href={`#help-${article.id}`} className="admin-action">{t("table.edit")}</Link>
          <form action={deleteHelpArticle}>
            <input type="hidden" name="id" value={article.id} />
            <button className="admin-danger">{t("table.delete")}</button>
          </form>
        </div>
      )
    },
    searchValues: {
      title: [article.title, article.excerpt].filter(Boolean).join(" "),
      category: article.category,
      slug: article.slug,
      locale: article.locale,
      status: article.isPublished ? "published" : "draft",
      updated: article.updatedAt.toISOString(),
      actions: ""
    }
  }));

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="admin-kicker">{t("page.kicker")}</div>
          <h1 className="admin-page-title mt-1">{t("page.title")}</h1>
        </div>
        <Link href="#help-new" className="admin-primary px-4 py-2">{t("page.addArticle")}</Link>
      </div>

      <AdminDataPageTable
        columns={[
          { key: "title", label: t("table.title"), className: "min-w-[300px]" },
          { key: "category", label: t("table.category") },
          { key: "slug", label: t("table.slug") },
          { key: "locale", label: t("table.locale") },
          { key: "status", label: t("table.status") },
          { key: "updated", label: t("table.updated") },
          { key: "actions", label: t("table.actions") }
        ]}
        rows={tableRows}
        searchPlaceholder={t("page.search")}
        showRowActions={false}
      />

      <HelpEditorModal id="help-new" title={t("editor.addTitle")} locales={locales} t={t} />
      {sortedArticles.map((article) => (
        <HelpEditorModal key={article.id} id={`help-${article.id}`} title={t("editor.editTitle", { title: article.title })} article={article} locales={locales} t={t} />
      ))}
    </section>
  );
}

function sortHelpArticles<T extends { sortOrder?: number | null; category: string; updatedAt: Date }>(articles: T[]) {
  return [...articles].sort((left, right) => {
    const orderDiff = Number(left.sortOrder ?? 0) - Number(right.sortOrder ?? 0);
    if (orderDiff) return orderDiff;
    const categoryDiff = left.category.localeCompare(right.category);
    if (categoryDiff) return categoryDiff;
    return right.updatedAt.getTime() - left.updatedAt.getTime();
  });
}

type ArticleRow = Awaited<ReturnType<typeof getHelpArticleEditorSnapshot>>["articles"][number];

function HelpEditorModal({
  id,
  title,
  article,
  locales,
  t
}: {
  id: string;
  title: string;
  article?: ArticleRow;
  locales: Awaited<ReturnType<typeof getHelpArticleEditorSnapshot>>["locales"];
  t: Awaited<ReturnType<typeof getTranslations<"help">>>;
}) {
  return (
    <AdminModal id={id} title={title}>
      <AdminSaveForm action={upsertHelpArticle} className="grid gap-4" submitLabel={t("editor.save")}>
        <input type="hidden" name="id" value={article?.id ?? ""} />
        <div className="grid gap-3 md:grid-cols-2">
          <input name="category" defaultValue={article?.category ?? t("editor.defaults.category")} placeholder={t("editor.placeholders.category")} className="admin-input" />
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <input type="checkbox" name="isPublished" defaultChecked={article?.isPublished ?? true} />
            {t("editor.published")}
          </label>
        </div>
        <Tabs defaultValue={locales[0]?.locale} className="gap-4">
          <TabsList variant="line" className="flex flex-wrap">
            {locales.map((locale) => {
              const description = article?.descriptions.find((item) => item.languageCode === locale.locale);
              const status = description?.translationStatus || "missing";
              return (
                <TabsTrigger key={locale.locale} value={locale.locale} className="gap-2 px-3 py-2">
                  <span>{locale.nativeName}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-slate-600">
                    {status}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
          {locales.map((locale) => {
            const description = article?.descriptions.find((item) => item.languageCode === locale.locale);
            return (
              <TabsContent key={locale.locale} value={locale.locale} className="space-y-4">
                <input name={`title:${locale.locale}`} defaultValue={description?.title ?? (locale.locale === "en" ? article?.title ?? "" : "")} placeholder={t("editor.placeholders.title")} className="admin-input" />
                <input name={`slug:${locale.locale}`} defaultValue={description?.slug ?? (locale.locale === "en" ? article?.slug ?? "" : "")} placeholder={t("editor.placeholders.slug")} className="admin-input" />
                <textarea name={`excerpt:${locale.locale}`} defaultValue={description?.summary ?? (locale.locale === "en" ? article?.excerpt ?? "" : "")} placeholder={t("editor.placeholders.excerpt")} className="admin-input min-h-24" />
                <select name={`translationStatus:${locale.locale}`} defaultValue={description?.translationStatus ?? (locale.locale === "en" ? "published" : "missing")} className="admin-input">
                  <option value="missing">missing</option>
                  <option value="draft">draft</option>
                  <option value="translated">translated</option>
                  <option value="needs_review">needs_review</option>
                  <option value="published">published</option>
                </select>
                <HtmlEditor name={`content:${locale.locale}`} defaultValue={description?.content ?? (locale.locale === "en" ? article?.content ?? "" : "")} minHeight={300} />
              </TabsContent>
            );
          })}
        </Tabs>
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
          {t("editor.uploadHint")}
        </div>
      </AdminSaveForm>
    </AdminModal>
  );
}
