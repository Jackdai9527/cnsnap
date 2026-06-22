import { requirePermission } from "@/lib/admin-session";
import { getTranslations } from "next-intl/server";
import { deleteSeoArticleTagMock, saveSeoArticleTagMock } from "@/app/admin/seo/actions";
import { getSeoArticleTags } from "@/modules/seo/lib/article-store";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminSaveForm } from "@/components/admin/AdminSaveForm";
import { AdminDataPageTable, type AdminDataTableRow } from "@/components/admin/modules/AdminDataPageTable";

export default async function AdminSeoArticleTagsPage() {
  await requirePermission("seo.manage");
  const t = await getTranslations("seo.taxonomy.tags");
  const tags = await getSeoArticleTags();
  const rows: AdminDataTableRow[] = tags.map((tag) => ({
    id: tag.id,
    cells: {
      name: <span className="font-bold text-slate-900">{tag.name}</span>,
      slug: tag.slug,
      description: <span className="line-clamp-2 text-sm text-slate-500">{tag.description}</span>,
      actions: (
        <div className="flex gap-2">
          <a href={`#tag-${tag.id}`} className="admin-action">{t("modal.edit", { name: tag.name })}</a>
          <form action={deleteSeoArticleTagMock}>
            <input type="hidden" name="id" value={tag.id} />
            <button className="admin-danger">{t("fields.delete")}</button>
          </form>
        </div>
      )
    },
    searchValues: {
      name: tag.name,
      slug: tag.slug,
      description: tag.description,
      actions: ""
    }
  }));

  return (
    <section className="space-y-6">
      <div className="admin-card p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ff1d5e]">{t("kicker")}</div>
            <h1 className="mt-2 text-3xl font-black text-slate-950">{t("title")}</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-slate-500">{t("description")}</p>
          </div>
          <a href="#tag-new" className="admin-primary rounded-full px-5 py-2.5 text-sm">{t("add")}</a>
        </div>

        <AdminDataPageTable
          columns={[
            { key: "name", label: t("fields.name") },
            { key: "slug", label: t("fields.slug") },
            { key: "description", label: t("fields.description") },
            { key: "actions", label: t("fields.actions") }
          ]}
          rows={rows}
          searchPlaceholder={t("search")}
          showRowActions={false}
        />
      </div>

      <TagEditorModal id="tag-new" title={t("modal.add")} t={t} />
      {tags.map((tag) => (
        <TagEditorModal key={tag.id} id={`tag-${tag.id}`} title={t("modal.edit", { name: tag.name })} tag={tag} t={t} />
      ))}
    </section>
  );
}

function TagEditorModal({ id, title, tag, t }: { id: string; title: string; tag?: Awaited<ReturnType<typeof getSeoArticleTags>>[number]; t: Awaited<ReturnType<typeof getTranslations<"seo.taxonomy.tags">>> }) {
  return (
    <AdminModal id={id} title={title}>
      <AdminSaveForm action={saveSeoArticleTagMock} className="grid gap-4" submitLabel={t("modal.save")}>
        <input type="hidden" name="id" value={tag?.id ?? ""} />
        <input type="hidden" name="createdAt" value={tag?.createdAt ?? ""} />
        <input name="name" defaultValue={tag?.name ?? ""} placeholder={t("placeholders.name")} className="admin-input" required />
        <input name="slug" defaultValue={tag?.slug ?? ""} placeholder={t("placeholders.slug")} className="admin-input" required />
        <textarea name="description" defaultValue={tag?.description ?? ""} placeholder={t("placeholders.description")} className="admin-input min-h-[120px] py-3" />
      </AdminSaveForm>
    </AdminModal>
  );
}
