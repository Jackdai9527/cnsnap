"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calculator, Heading2, Sparkles, Wand2 } from "lucide-react";
import { HtmlEditor } from "@/components/admin/HtmlEditor";
import { Button } from "@/components/ui/button";
import { useSeoArticleEditor } from "@/modules/seo/hooks/useSeoArticleEditor";
import type { SeoArticleEditorValues } from "@/modules/seo/hooks/useSeoArticleEditor";
import type { SeoArticleCategory, SeoArticleRecord, SeoArticleTag } from "@/modules/seo/types";

type SeoArticleEditorFormProps = {
  article?: SeoArticleRecord | null;
  initialValues?: Partial<SeoArticleEditorValues> | null;
  categories: SeoArticleCategory[];
  tags: SeoArticleTag[];
  relatedArticles: SeoArticleRecord[];
  seoLocales: string[];
  onSave: (formData: FormData) => Promise<void>;
  onGenerateSlug: (formData: FormData) => Promise<string>;
  onCalculateReadingTime: (formData: FormData) => Promise<number>;
  onGenerateTableOfContents: (formData: FormData) => Promise<string[]>;
};

export function SeoArticleEditorForm({
  article,
  initialValues,
  categories,
  tags,
  relatedArticles,
  seoLocales,
  onSave,
  onGenerateSlug,
  onCalculateReadingTime,
  onGenerateTableOfContents
}: SeoArticleEditorFormProps) {
  const t = useTranslations("seo.articleEditor");
  const commonSave = useTranslations("common.saveForm");
  const form = useSeoArticleEditor(article, initialValues);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [readingTimePreview, setReadingTimePreview] = useState<number | null>(article?.readingTime ?? null);
  const [tocPreview, setTocPreview] = useState<string[]>([]);

  function submit(values: SeoArticleEditorValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => formData.append(key, item));
        return;
      }
      formData.set(key, value ?? "");
    });

    startTransition(async () => {
      try {
        await onSave(formData);
        toast.success(t("saved"));
        router.push("/admin/seo/articles");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("saveFailed"));
      }
    });
  }

  function handleGenerateSlug() {
    const formData = new FormData();
    formData.set("title", form.getValues("title"));
    startTransition(async () => {
      try {
        const slug = await onGenerateSlug(formData);
        form.setValue("slug", slug, { shouldValidate: true, shouldDirty: true });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("generateSlugFailed"));
      }
    });
  }

  function handleReadingTime() {
    const formData = new FormData();
    formData.set("content", form.getValues("content"));
    startTransition(async () => {
      try {
        const readingTime = await onCalculateReadingTime(formData);
        setReadingTimePreview(readingTime);
        toast.success(t("readingTimeSuccess", { minutes: readingTime }));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("readingTimeFailed"));
      }
    });
  }

  function handleGenerateToc() {
    const formData = new FormData();
    formData.set("content", form.getValues("content"));
    startTransition(async () => {
      try {
        const toc = await onGenerateTableOfContents(formData);
        setTocPreview(toc);
        toast.success(t("tocSuccess", { count: toc.length, suffix: toc.length === 1 ? "" : "s" }));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("tocFailed"));
      }
    });
  }

  return (
    <form className="grid gap-6" onSubmit={form.handleSubmit((values) => submit(values))}>
      <input type="hidden" {...form.register("id")} />
      <input type="hidden" {...form.register("translationGroupId")} />
      <input type="hidden" {...form.register("translatedFromId")} />

      <section className="admin-card grid gap-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-950">{t("sections.content")}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">{t("sections.contentDescription")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="rounded-full" onClick={handleGenerateSlug} disabled={isPending}>
              <Sparkles size={15} />
              {t("actions.generateSlug")}
            </Button>
            <Button type="button" variant="outline" className="rounded-full" onClick={() => form.setValue("seoTitle", form.getValues("title"), { shouldDirty: true })}>
              <Wand2 size={15} />
              {t("actions.useTitleAsSeoTitle")}
            </Button>
            <Button type="button" variant="outline" className="rounded-full" onClick={() => form.setValue("seoDescription", form.getValues("excerpt"), { shouldDirty: true })}>
              <Wand2 size={15} />
              {t("actions.useExcerptAsMetaDescription")}
            </Button>
            <Button type="button" variant="outline" className="rounded-full" onClick={handleReadingTime} disabled={isPending}>
              <Calculator size={15} />
              {t("actions.calculateReadingTime")}
            </Button>
            <Button type="button" variant="outline" className="rounded-full" onClick={handleGenerateToc} disabled={isPending}>
              <Heading2 size={15} />
              {t("actions.generateToc")}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("fields.title")} error={form.formState.errors.title?.message}>
            <input {...form.register("title")} className="input h-11" />
          </Field>
          <Field label={t("fields.slug")} error={form.formState.errors.slug?.message}>
            <input {...form.register("slug")} className="input h-11" />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("fields.localizedSlug")}>
            <input {...form.register("localizedSlug")} className="input h-11" />
          </Field>
          <Field label={t("fields.sourceLanguage")}>
            <select {...form.register("sourceLanguage")} className="input h-11">
              {seoLocales.map((locale) => (
                <option key={locale} value={locale}>{locale}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label={t("fields.excerpt")} error={form.formState.errors.excerpt?.message}>
          <textarea {...form.register("excerpt")} className="input min-h-[110px] py-3" />
        </Field>

        <Field label={t("fields.coverImage")}>
          <input {...form.register("coverImage")} className="input h-11" placeholder={t("placeholders.coverImage")} />
        </Field>

        <div>
          <div className="mb-2 text-sm font-black text-slate-900">{t("fields.content")}</div>
          <HtmlEditor name="content" defaultValue={form.getValues("content")} minHeight={420} />
          {form.formState.errors.content?.message ? <div className="mt-2 text-xs font-bold text-red-600">{form.formState.errors.content.message}</div> : null}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label={t("fields.category")}>
            <select {...form.register("categoryId")} className="input h-11">
              <option value="">{t("states.selectCategory")}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </Field>
          <Field label={t("fields.status")}>
            <select {...form.register("status")} className="input h-11">
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="scheduled">scheduled</option>
              <option value="archived">archived</option>
            </select>
          </Field>
          <Field label={t("fields.language")}>
            <select {...form.register("language")} className="input h-11">
              {seoLocales.map((locale) => (
                <option key={locale} value={locale}>{locale}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label={t("fields.publishedAt")}>
          <input {...form.register("publishedAt")} type="datetime-local" className="input h-11" />
        </Field>

        <div className="grid gap-3">
          <div className="text-sm font-black text-slate-900">{t("fields.tags")}</div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {tags.map((tag) => (
              <label key={tag.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                <input type="checkbox" value={tag.id} {...form.register("tagIds")} />
                <span>{tag.name}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="admin-card grid gap-5 p-6">
        <h2 className="text-xl font-black text-slate-950">{t("sections.seo")}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("fields.seoTitle")}>
            <input {...form.register("seoTitle")} className="input h-11" />
          </Field>
          <Field label={t("fields.canonicalUrl")}>
            <input {...form.register("canonicalUrl")} className="input h-11" />
          </Field>
        </div>

        <Field label={t("fields.seoDescription")}>
          <textarea {...form.register("seoDescription")} className="input min-h-[110px] py-3" />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("fields.robots")}>
            <select {...form.register("robots")} className="input h-11">
              <option value="index,follow">index,follow</option>
              <option value="noindex,follow">noindex,follow</option>
              <option value="noindex,nofollow">noindex,nofollow</option>
            </select>
          </Field>
          <Field label={t("fields.ctaType")}>
            <select {...form.register("ctaType")} className="input h-11">
              <option value="start_shopping">start_shopping</option>
              <option value="estimate_shipping">estimate_shipping</option>
              <option value="submit_diy_order">submit_diy_order</option>
              <option value="use_forwarding">use_forwarding</option>
              <option value="open_ticket">open_ticket</option>
              <option value="register">register</option>
              <option value="none">none</option>
            </select>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("fields.ogTitle")}>
            <input {...form.register("ogTitle")} className="input h-11" />
          </Field>
          <Field label={t("fields.ogImage")}>
            <input {...form.register("ogImage")} className="input h-11" />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("fields.twitterTitle")}>
            <input {...form.register("twitterTitle")} className="input h-11" />
          </Field>
          <Field label={t("fields.twitterImage")}>
            <input {...form.register("twitterImage")} className="input h-11" />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("fields.ogDescription")}>
            <textarea {...form.register("ogDescription")} className="input min-h-[96px] py-3" />
          </Field>
          <Field label={t("fields.twitterDescription")}>
            <textarea {...form.register("twitterDescription")} className="input min-h-[96px] py-3" />
          </Field>
        </div>
      </section>

      <section className="admin-card grid gap-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black text-slate-950">{t("sections.enhancement")}</h2>
          <div className="flex flex-wrap gap-3 text-xs font-bold text-slate-500">
            <span>{t("meta.readingTime")}: {readingTimePreview ?? t("states.notCalculated")}</span>
            <span>{t("meta.tocItems")}: {tocPreview.length || t("states.noneGenerated")}</span>
          </div>
        </div>

        <Field label={t("fields.faqJson")}>
          <textarea {...form.register("faqJson")} className="input min-h-[130px] py-3 font-mono text-xs" placeholder={t("placeholders.faqJson")} />
        </Field>

        <Field label={t("fields.relatedArticles")}>
          <div className="grid gap-2 md:grid-cols-2">
            {relatedArticles.filter((item) => item.id !== article?.id).map((item) => (
              <label key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                <input type="checkbox" value={item.id} {...form.register("relatedArticleIds")} />
                <span>{item.title}</span>
              </label>
            ))}
          </div>
        </Field>

        <Field label={t("fields.relatedLinksJson")}>
          <textarea {...form.register("relatedLinksJson")} className="input min-h-[130px] py-3 font-mono text-xs" placeholder={t("placeholders.relatedLinksJson")} />
        </Field>
      </section>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" className="rounded-full px-5 font-black" onClick={() => router.push("/admin/seo/articles")}>
          {t("actions.cancel")}
        </Button>
        <Button type="submit" className="rounded-full bg-[#ff1d5e] px-5 font-black text-white hover:bg-[#e21654]" disabled={isPending}>
          {isPending ? commonSave("saving") : article ? t("actions.save") : t("actions.create")}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-slate-900">{label}</span>
      {children}
      {error ? <span className="text-xs font-bold text-red-600">{error}</span> : null}
    </label>
  );
}
