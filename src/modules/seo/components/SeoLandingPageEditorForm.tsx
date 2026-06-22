"use client";

import { useMemo, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import { HtmlEditor } from "@/components/admin/HtmlEditor";
import { Button } from "@/components/ui/button";
import { useSeoLandingPageEditor } from "@/modules/seo/hooks/useSeoLandingPageEditor";
import type { SeoLandingPageEditorValues } from "@/modules/seo/hooks/useSeoLandingPageEditor";
import type { SeoFaqItem, SeoLandingPageRecord, SeoLandingPageSection } from "@/modules/seo/types";

type SeoLandingPageEditorFormProps = {
  page?: SeoLandingPageRecord | null;
  initialValues?: Partial<SeoLandingPageEditorValues> | null;
  seoLocales: string[];
  onSave: (formData: FormData) => Promise<void>;
  onGenerateSlug: (formData: FormData) => Promise<string>;
  onGeneratePath: (formData: FormData) => Promise<string>;
};

export function SeoLandingPageEditorForm({ page, initialValues, seoLocales, onSave, onGenerateSlug, onGeneratePath }: SeoLandingPageEditorFormProps) {
  const t = useTranslations("seo.landingEditor");
  const commonSave = useTranslations("common.saveForm");
  const form = useSeoLandingPageEditor(page, initialValues);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const sectionsJson = form.watch("sectionsJson");
  const faqJson = form.watch("faqJson");
  const sections = useMemo(() => parseSections(sectionsJson || ""), [sectionsJson]);
  const faqItems = useMemo(() => parseFaqItems(faqJson || ""), [faqJson]);

  function submit(values: SeoLandingPageEditorValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.set(key, value ?? "");
    });

    startTransition(async () => {
      try {
        await onSave(formData);
        toast.success(t("saved"));
        router.push("/admin/seo/landing-pages");
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

  function handleGeneratePath() {
    const formData = new FormData();
    formData.set("type", form.getValues("type"));
    formData.set("slug", form.getValues("slug"));
    startTransition(async () => {
      try {
        const path = await onGeneratePath(formData);
        form.setValue("path", path, { shouldValidate: true, shouldDirty: true });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("generatePathFailed"));
      }
    });
  }

  function updateSections(nextSections: SeoLandingPageSection[]) {
    form.setValue("sectionsJson", stringifySections(nextSections), { shouldDirty: true, shouldValidate: true });
  }

  function updateFaqItems(nextFaqItems: SeoFaqItem[]) {
    form.setValue("faqJson", stringifyFaqItems(nextFaqItems), { shouldDirty: true, shouldValidate: true });
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
            <Button type="button" variant="outline" className="rounded-full" onClick={handleGeneratePath} disabled={isPending}>
              <Sparkles size={15} />
              {t("actions.generatePath")}
            </Button>
            <Button type="button" variant="outline" className="rounded-full" onClick={() => form.setValue("seoTitle", form.getValues("heroTitle"), { shouldDirty: true })}>
              <Wand2 size={15} />
              {t("actions.useHeroTitleAsSeoTitle")}
            </Button>
            <Button type="button" variant="outline" className="rounded-full" onClick={() => form.setValue("seoDescription", form.getValues("heroSubtitle"), { shouldDirty: true })}>
              <Wand2 size={15} />
              {t("actions.useHeroSubtitleAsMetaDescription")}
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

        <div className="grid gap-4 md:grid-cols-3">
          <Field label={t("fields.type")} error={form.formState.errors.type?.message}>
            <select {...form.register("type")} className="input h-11">
              <option value="platform">platform</option>
              <option value="shipping_country">shipping_country</option>
              <option value="campaign">campaign</option>
              <option value="service">service</option>
              <option value="custom">custom</option>
            </select>
          </Field>
          <Field label={t("fields.path")} error={form.formState.errors.path?.message}>
            <input {...form.register("path")} className="input h-11" />
          </Field>
          <Field label={t("fields.language")}>
            <select {...form.register("language")} className="input h-11">
              {seoLocales.map((locale) => (
                <option key={locale} value={locale}>{locale}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("fields.localizedPath")}>
            <input {...form.register("localizedPath")} className="input h-11" />
          </Field>
          <Field label={t("fields.sourceLanguage")}>
            <select {...form.register("sourceLanguage")} className="input h-11">
              {seoLocales.map((locale) => (
                <option key={locale} value={locale}>{locale}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("fields.heroTitle")} error={form.formState.errors.heroTitle?.message}>
            <input {...form.register("heroTitle")} className="input h-11" />
          </Field>
          <Field label={t("fields.heroSubtitle")}>
            <textarea {...form.register("heroSubtitle")} className="input min-h-[96px] py-3" />
          </Field>
        </div>

        <div>
          <div className="mb-2 text-sm font-black text-slate-900">{t("fields.pageContent")}</div>
          <p className="mb-3 text-xs font-semibold leading-6 text-slate-500">{t("fields.pageContentHelp")}</p>
          <HtmlEditor name="content" defaultValue={form.getValues("content")} minHeight={420} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("fields.ctaText")}>
            <input {...form.register("ctaText")} className="input h-11" />
          </Field>
          <Field label={t("fields.ctaHref")} error={form.formState.errors.ctaHref?.message}>
            <input {...form.register("ctaHref")} className="input h-11" placeholder={t("placeholders.ctaHref")} />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("fields.status")}>
            <select {...form.register("status")} className="input h-11">
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </Field>
          <Field label={t("fields.publishedAt")}>
            <input {...form.register("publishedAt")} type="datetime-local" className="input h-11" />
          </Field>
        </div>
      </section>

      <section className="admin-card grid gap-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-950">{t("sections.structured")}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">{t("sections.structuredDescription")}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-bold text-slate-500">
            <span>{t("meta.sectionCount")}: {sections.length}</span>
            <span>{t("meta.faqCount")}: {faqItems.length}</span>
          </div>
        </div>

        <details className="rounded-3xl border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-black text-slate-900">{t("sections.advancedStructured")}</summary>
          <div className="mt-4 grid gap-6">
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-black text-slate-900">{t("fields.sections")}</div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() =>
                    updateSections([
                      ...sections,
                      { title: "", description: "", bullets: [] }
                    ])
                  }
                >
                  <Plus size={14} />
                  {t("actions.addSection")}
                </Button>
              </div>
              <div className="grid gap-4">
                {sections.length ? (
                  sections.map((section, index) => (
                    <div key={`${index}-${section.title}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="text-sm font-black text-slate-900">{t("states.sectionLabel", { index: index + 1 })}</div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="rounded-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => updateSections(sections.filter((_, sectionIndex) => sectionIndex !== index))}
                        >
                          <Trash2 size={14} />
                          {t("actions.removeSection")}
                        </Button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label={t("fields.sectionTitle")}>
                          <input
                            value={section.title}
                            onChange={(event) => {
                              const next = [...sections];
                              next[index] = { ...section, title: event.target.value };
                              updateSections(next);
                            }}
                            className="input h-11"
                          />
                        </Field>
                        <Field label={t("fields.sectionBullets")}>
                          <textarea
                            value={(section.bullets || []).join("\n")}
                            onChange={(event) => {
                              const next = [...sections];
                              next[index] = {
                                ...section,
                                bullets: event.target.value
                                  .split("\n")
                                  .map((item) => item.trim())
                                  .filter(Boolean)
                              };
                              updateSections(next);
                            }}
                            className="input min-h-[120px] py-3"
                            placeholder={t("placeholders.sectionBullets")}
                          />
                        </Field>
                      </div>
                      <Field label={t("fields.sectionDescription")}>
                        <textarea
                          value={section.description}
                          onChange={(event) => {
                            const next = [...sections];
                            next[index] = { ...section, description: event.target.value };
                            updateSections(next);
                          }}
                          className="input min-h-[120px] py-3"
                        />
                      </Field>
                    </div>
                  ))
                ) : (
                  <EmptyPanel text={t("states.noSections")} />
                )}
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-black text-slate-900">{t("fields.faqItems")}</div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() =>
                    updateFaqItems([
                      ...faqItems,
                      { question: "", answer: "" }
                    ])
                  }
                >
                  <Plus size={14} />
                  {t("actions.addFaq")}
                </Button>
              </div>
              <div className="grid gap-4">
                {faqItems.length ? (
                  faqItems.map((item, index) => (
                    <div key={`${index}-${item.question}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="text-sm font-black text-slate-900">{t("states.faqLabel", { index: index + 1 })}</div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="rounded-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => updateFaqItems(faqItems.filter((_, faqIndex) => faqIndex !== index))}
                        >
                          <Trash2 size={14} />
                          {t("actions.removeFaq")}
                        </Button>
                      </div>
                      <Field label={t("fields.faqQuestion")}>
                        <input
                          value={item.question}
                          onChange={(event) => {
                            const next = [...faqItems];
                            next[index] = { ...item, question: event.target.value };
                            updateFaqItems(next);
                          }}
                          className="input h-11"
                        />
                      </Field>
                      <Field label={t("fields.faqAnswer")}>
                        <textarea
                          value={item.answer}
                          onChange={(event) => {
                            const next = [...faqItems];
                            next[index] = { ...item, answer: event.target.value };
                            updateFaqItems(next);
                          }}
                          className="input min-h-[120px] py-3"
                        />
                      </Field>
                    </div>
                  ))
                ) : (
                  <EmptyPanel text={t("states.noFaq")} />
                )}
              </div>
            </div>

            <div className="grid gap-4">
              <Field label={t("fields.sectionsJson")}>
                <textarea {...form.register("sectionsJson")} className="input min-h-[150px] py-3 font-mono text-xs" placeholder={t("placeholders.sectionsJson")} />
              </Field>
              <Field label={t("fields.faqJson")}>
                <textarea {...form.register("faqJson")} className="input min-h-[150px] py-3 font-mono text-xs" placeholder={t("placeholders.faqJson")} />
              </Field>
            </div>
          </div>
        </details>
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
          <textarea {...form.register("seoDescription")} className="input min-h-[96px] py-3" />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("fields.robots")}>
            <select {...form.register("robots")} className="input h-11">
              <option value="index,follow">index,follow</option>
              <option value="noindex,follow">noindex,follow</option>
              <option value="noindex,nofollow">noindex,nofollow</option>
            </select>
          </Field>
          <Field label={t("fields.structuredDataJson")}>
            <textarea {...form.register("structuredDataJson")} className="input min-h-[96px] py-3 font-mono text-xs" />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("fields.ogTitle")}>
            <input {...form.register("ogTitle")} className="input h-11" />
          </Field>
          <Field label={t("fields.ogImage")}>
            <input {...form.register("ogImage")} className="input h-11" placeholder={t("placeholders.ogImage")} />
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

        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("fields.twitterTitle")}>
            <input {...form.register("twitterTitle")} className="input h-11" />
          </Field>
          <Field label={t("fields.twitterImage")}>
            <input {...form.register("twitterImage")} className="input h-11" placeholder={t("placeholders.twitterImage")} />
          </Field>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" className="rounded-full px-5 font-black" onClick={() => router.push("/admin/seo/landing-pages")}>
          {t("actions.cancel")}
        </Button>
        <Button type="submit" className="rounded-full bg-[#ff1d5e] px-5 font-black text-white hover:bg-[#e21654]" disabled={isPending}>
          {isPending ? commonSave("saving") : page ? t("actions.save") : t("actions.create")}
        </Button>
      </div>
    </form>
  );
}

function parseSections(raw: string) {
  if (!raw.trim()) return [] as SeoLandingPageSection[];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      title: String(item?.title || ""),
      description: String(item?.description || ""),
      bullets: Array.isArray(item?.bullets) ? item.bullets.map((bullet: unknown) => String(bullet)) : []
    }));
  } catch {
    return [];
  }
}

function parseFaqItems(raw: string) {
  if (!raw.trim()) return [] as SeoFaqItem[];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      question: String(item?.question || ""),
      answer: String(item?.answer || "")
    }));
  } catch {
    return [];
  }
}

function stringifySections(items: SeoLandingPageSection[]) {
  return JSON.stringify(
    items
      .map((item) => ({
        title: item.title.trim(),
        description: item.description.trim(),
        bullets: (item.bullets || []).map((bullet) => bullet.trim()).filter(Boolean)
      }))
      .filter((item) => item.title || item.description || item.bullets.length),
    null,
    2
  );
}

function stringifyFaqItems(items: SeoFaqItem[]) {
  return JSON.stringify(
    items
      .map((item) => ({
        question: item.question.trim(),
        answer: item.answer.trim()
      }))
      .filter((item) => item.question || item.answer),
    null,
    2
  );
}

function EmptyPanel({ text }: { text: string }) {
  return <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-semibold text-slate-500">{text}</div>;
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
