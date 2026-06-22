import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminSaveForm } from "@/components/admin/AdminSaveForm";
import { HtmlEditor } from "@/components/admin/HtmlEditor";
import { AdminDataPageTable, type AdminDataTableRow } from "@/components/admin/modules/AdminDataPageTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusPill } from "@/components/ui/StatusPill";
import { getPageEditorSnapshot } from "@/lib/content-localization";
import { deletePage, upsertPage } from "../actions";

export default async function AdminPagesPage() {
  const t = await getTranslations("pages");
  const { pages, locales } = await getPageEditorSnapshot();
  const tableRows: AdminDataTableRow[] = pages.map((page) => ({
    id: String(page.id),
    cells: {
      title: <span className="font-bold text-slate-900">{page.title}</span>,
      slug: <Link href={`/page/${page.slug}`} className="text-[#465fff]" target="_blank">/page/{page.slug}</Link>,
      status: <StatusPill status={page.isPublished ? "published" : "draft"} />,
      updated: page.updatedAt.toLocaleDateString(),
      actions: (
        <div className="flex gap-2">
          <Link href={`#page-${page.id}`} className="admin-action">{t("table.edit")}</Link>
          <form action={deletePage}>
            <input type="hidden" name="id" value={page.id} />
            <button className="admin-danger">{t("table.delete")}</button>
          </form>
        </div>
      )
    },
    searchValues: {
      title: page.title,
      slug: page.slug,
      status: page.isPublished ? "published" : "draft",
      updated: page.updatedAt.toISOString(),
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
        <Link href="#page-new" className="admin-primary px-4 py-2">{t("page.addPage")}</Link>
      </div>

      <AdminDataPageTable
        columns={[
          { key: "title", label: t("table.title") },
          { key: "slug", label: t("table.slug") },
          { key: "status", label: t("table.status") },
          { key: "updated", label: t("table.updated") },
          { key: "actions", label: t("table.actions") }
        ]}
        rows={tableRows}
        searchPlaceholder={t("page.search")}
        showRowActions={false}
      />

      <PageEditorModal id="page-new" title={t("editor.addTitle")} locales={locales} t={t} />
      {pages.map((page) => (
        <PageEditorModal key={page.id} id={`page-${page.id}`} title={t("editor.editTitle", { title: page.title })} page={page} locales={locales} t={t} />
      ))}
    </section>
  );
}

type PageRow = Awaited<ReturnType<typeof getPageEditorSnapshot>>["pages"][number];

function PageEditorModal({
  id,
  title,
  page,
  locales,
  t
}: {
  id: string;
  title: string;
  page?: PageRow;
  locales: Awaited<ReturnType<typeof getPageEditorSnapshot>>["locales"];
  t: Awaited<ReturnType<typeof getTranslations<"pages">>>;
}) {
  return (
    <AdminModal id={id} title={title}>
      <AdminSaveForm action={upsertPage} className="grid gap-4" submitLabel={t("editor.save")}>
        <input type="hidden" name="id" value={page?.id ?? ""} />
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <input type="checkbox" name="isPublished" defaultChecked={page?.isPublished ?? true} />
          {t("editor.published")}
        </label>
        <Tabs defaultValue={locales[0]?.locale} className="gap-4">
          <TabsList variant="line" className="flex flex-wrap">
            {locales.map((locale) => {
              const description = page?.descriptions.find((item) => item.languageCode === locale.locale);
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
            const description = page?.descriptions.find((item) => item.languageCode === locale.locale);
            return (
              <TabsContent key={locale.locale} value={locale.locale} className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <input name={`title:${locale.locale}`} defaultValue={description?.title ?? (locale.locale === "en" ? page?.title ?? "" : "")} placeholder={t("editor.placeholders.title")} className="admin-input" required={locale.locale === "en"} />
                  <input name={`slug:${locale.locale}`} defaultValue={description?.slug ?? (locale.locale === "en" ? page?.slug ?? "" : "")} placeholder={t("editor.placeholders.slug")} className="admin-input" required={locale.locale === "en"} />
                </div>
                <select name={`translationStatus:${locale.locale}`} defaultValue={description?.translationStatus ?? (locale.locale === "en" ? "published" : "missing")} className="admin-input">
                  <option value="missing">missing</option>
                  <option value="draft">draft</option>
                  <option value="translated">translated</option>
                  <option value="needs_review">needs_review</option>
                  <option value="published">published</option>
                </select>
                <HtmlEditor name={`contentHtml:${locale.locale}`} defaultValue={description?.contentHtml ?? (locale.locale === "en" ? page?.contentHtml ?? t("editor.placeholders.content") : "")} minHeight={320} />
              </TabsContent>
            );
          })}
        </Tabs>
      </AdminSaveForm>
    </AdminModal>
  );
}
