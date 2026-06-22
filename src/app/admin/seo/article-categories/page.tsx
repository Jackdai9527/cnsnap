import { requirePermission } from "@/lib/admin-session";
import { getEnabledSeoLocalesRuntime } from "@/lib/i18n/locale-config-store";
import { getTranslations } from "next-intl/server";
import { getSeoArticleCategories } from "@/modules/seo/lib/article-store";
import { saveSeoArticleCategoryMock } from "@/app/admin/seo/actions";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminSaveForm } from "@/components/admin/AdminSaveForm";
import { StatusPill } from "@/components/ui/StatusPill";
import { AdminDataPageTable, type AdminDataTableRow } from "@/components/admin/modules/AdminDataPageTable";

export default async function AdminSeoArticleCategoriesPage() {
  await requirePermission("seo.manage");
  const t = await getTranslations("seo.taxonomy.categories");
  const [categories, seoLocales] = await Promise.all([getSeoArticleCategories(), getEnabledSeoLocalesRuntime()]);
  const rows: AdminDataTableRow[] = categories.map((category) => ({
    id: category.id,
    cells: {
      name: <span className="font-bold text-slate-900">{category.name}</span>,
      slug: category.slug,
      description: <span className="line-clamp-2 text-sm text-slate-500">{category.description}</span>,
      sortOrder: String(category.sortOrder),
      status: <StatusPill status={category.status} />,
      actions: <a href={`#category-${category.id}`} className="admin-action">{t("modal.edit", { name: category.name })}</a>
    },
    searchValues: {
      name: category.name,
      slug: category.slug,
      description: category.description,
      sortOrder: String(category.sortOrder),
      status: category.status,
      actions: ""
    },
    actionHref: `#category-${category.id}`,
    actionLabel: t("modal.edit", { name: category.name })
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
          <a href="#category-new" className="admin-primary rounded-full px-5 py-2.5 text-sm">{t("add")}</a>
        </div>

        <AdminDataPageTable
          columns={[
            { key: "name", label: t("fields.name") },
            { key: "slug", label: t("fields.slug") },
            { key: "description", label: t("fields.description") },
            { key: "sortOrder", label: t("fields.sortOrder") },
            { key: "status", label: t("fields.status") },
            { key: "actions", label: t("fields.actions") }
          ]}
          rows={rows}
          searchPlaceholder={t("search")}
          showRowActions={false}
        />
      </div>

      <CategoryEditorModal id="category-new" title={t("modal.add")} t={t} />
      {categories.map((category) => (
        <CategoryEditorModal key={category.id} id={`category-${category.id}`} title={t("modal.edit", { name: category.name })} category={category} categories={categories} seoLocales={seoLocales} t={t} />
      ))}
    </section>
  );
}

function CategoryEditorModal({
  id,
  title,
  category,
  categories = [],
  seoLocales = [],
  t
}: {
  id: string;
  title: string;
  category?: Awaited<ReturnType<typeof getSeoArticleCategories>>[number];
  categories?: Awaited<ReturnType<typeof getSeoArticleCategories>>;
  seoLocales?: string[];
  t: Awaited<ReturnType<typeof getTranslations<"seo.taxonomy.categories">>>;
}) {
  const translations = category?.translationGroupId
    ? categories.filter((item) => item.translationGroupId === category.translationGroupId)
    : category ? [category] : [];

  return (
    <AdminModal id={id} title={title}>
      <AdminSaveForm action={saveSeoArticleCategoryMock} className="grid gap-4" submitLabel={t("modal.save")}>
        <input type="hidden" name="id" value={category?.id ?? ""} />
        <input type="hidden" name="createdAt" value={category?.createdAt ?? ""} />
        <input type="hidden" name="translationGroupId" value={category?.translationGroupId ?? ""} />
        <input type="hidden" name="translatedFromId" value={category?.translatedFromId ?? ""} />
        <div className="flex flex-wrap gap-2">
          {translations.map((item) => (
            <a
              key={item.id}
              href={`#category-${item.id}`}
              className={`rounded-full px-4 py-2 text-xs font-black ${item.id === category?.id ? "bg-[#ff1d5e] text-white" : "border border-slate-200 bg-white text-slate-700"}`}
            >
              {item.language || "en"}
            </a>
          ))}
          {category ? seoLocales.filter((locale) => !translations.some((item) => item.language === locale)).map((locale) => (
            <a
              key={locale}
              href={`#category-new-${category.id}-${locale}`}
              className="rounded-full border border-dashed border-[#ff1d5e] bg-white px-4 py-2 text-xs font-black text-[#ff1d5e]"
            >
              {t("createTranslation", { locale })}
            </a>
          )) : null}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input name="name" defaultValue={category?.name ?? ""} placeholder={t("placeholders.name")} className="admin-input" required />
          <input name="slug" defaultValue={category?.slug ?? ""} placeholder={t("placeholders.slug")} className="admin-input" required />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input name="localizedSlug" defaultValue={category?.localizedSlug ?? ""} placeholder={t("placeholders.localizedSlug")} className="admin-input" />
          <select name="language" defaultValue={category?.language ?? "en"} className="admin-input">
            {seoLocales.map((locale) => (
              <option key={locale} value={locale}>{locale}</option>
            ))}
          </select>
        </div>
        <textarea name="description" defaultValue={category?.description ?? ""} placeholder={t("placeholders.description")} className="admin-input min-h-[120px] py-3" />
        <div className="grid gap-3 md:grid-cols-2">
          <input name="seoTitle" defaultValue={category?.seoTitle ?? ""} placeholder={t("placeholders.seoTitle")} className="admin-input" />
          <input name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 0} className="admin-input" />
        </div>
        <textarea name="seoDescription" defaultValue={category?.seoDescription ?? ""} placeholder={t("placeholders.seoDescription")} className="admin-input min-h-[120px] py-3" />
        <select name="status" defaultValue={category?.status ?? "active"} className="admin-input">
          <option value="active">active</option>
          <option value="disabled">disabled</option>
        </select>
      </AdminSaveForm>
    </AdminModal>
  );
}
