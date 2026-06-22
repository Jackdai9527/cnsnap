"use client";

import { useMemo } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SeoArticleCtaType, SeoArticleRecord, SeoArticleStatus, SeoRobotsValue } from "@/modules/seo/types";

const articleSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(5, "Title must be at least 5 characters."),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must use lowercase letters, numbers, and hyphens only."),
  localizedSlug: z.string().trim().optional(),
  excerpt: z.string().trim().min(1, "Excerpt is required."),
  content: z.string().trim().min(300, "Content must be at least 300 characters."),
  coverImage: z.string().optional(),
  categoryId: z.string().min(1, "Category is required."),
  tagIds: z.array(z.string()).default([]),
  status: z.enum(["draft", "published", "scheduled", "archived"] satisfies SeoArticleStatus[]),
  language: z.string().default("en"),
  translationGroupId: z.string().optional(),
  sourceLanguage: z.string().optional(),
  translatedFromId: z.string().optional(),
  publishedAt: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  canonicalUrl: z.string().optional(),
  robots: z.enum(["index,follow", "noindex,follow", "noindex,nofollow"] satisfies SeoRobotsValue[]),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: z.string().optional(),
  faqJson: z.string().optional(),
  relatedArticleIds: z.array(z.string()).default([]),
  relatedLinksJson: z.string().optional(),
  ctaType: z.enum(["start_shopping", "estimate_shipping", "submit_diy_order", "use_forwarding", "open_ticket", "register", "none"] satisfies SeoArticleCtaType[])
});

export type SeoArticleEditorValues = z.infer<typeof articleSchema>;

export function useSeoArticleEditor(
  article?: SeoArticleRecord | null,
  initialValues?: Partial<SeoArticleEditorValues> | null
): UseFormReturn<SeoArticleEditorValues> {
  const defaultValues = useMemo<SeoArticleEditorValues>(
    () => ({
      id: initialValues?.id ?? article?.id,
      title: initialValues?.title ?? (article?.title || ""),
      slug: initialValues?.slug ?? (article?.slug || ""),
      localizedSlug: initialValues?.localizedSlug ?? (article?.localizedSlug || ""),
      excerpt: initialValues?.excerpt ?? (article?.excerpt || ""),
      content: initialValues?.content ?? (article?.content || "<p>Write your SEO article here.</p><p>Add enough useful detail to exceed the minimum content threshold.</p><p>Use H2 sections for a cleaner table of contents.</p>"),
      coverImage: initialValues?.coverImage ?? (article?.coverImage || ""),
      categoryId: initialValues?.categoryId ?? (article?.categoryId || ""),
      tagIds: initialValues?.tagIds ?? (article?.tagIds || []),
      status: initialValues?.status ?? (article?.status || "draft"),
      language: initialValues?.language ?? (article?.language || "en"),
      translationGroupId: initialValues?.translationGroupId ?? (article?.translationGroupId || ""),
      sourceLanguage: initialValues?.sourceLanguage ?? (article?.sourceLanguage || article?.language || "en"),
      translatedFromId: initialValues?.translatedFromId ?? (article?.translatedFromId || ""),
      publishedAt: initialValues?.publishedAt ?? (article?.publishedAt ? article.publishedAt.slice(0, 16) : ""),
      seoTitle: initialValues?.seoTitle ?? (article?.seoTitle || ""),
      seoDescription: initialValues?.seoDescription ?? (article?.seoDescription || ""),
      canonicalUrl: initialValues?.canonicalUrl ?? (article?.canonicalUrl || ""),
      robots: initialValues?.robots ?? (article?.robots || "index,follow"),
      ogTitle: initialValues?.ogTitle ?? (article?.ogTitle || ""),
      ogDescription: initialValues?.ogDescription ?? (article?.ogDescription || ""),
      ogImage: initialValues?.ogImage ?? (article?.ogImage || ""),
      twitterTitle: initialValues?.twitterTitle ?? (article?.twitterTitle || ""),
      twitterDescription: initialValues?.twitterDescription ?? (article?.twitterDescription || ""),
      twitterImage: initialValues?.twitterImage ?? (article?.twitterImage || ""),
      faqJson: initialValues?.faqJson ?? (article?.faqJson || ""),
      relatedArticleIds: initialValues?.relatedArticleIds ?? (article?.relatedArticleIds || []),
      relatedLinksJson: initialValues?.relatedLinksJson ?? (article?.relatedLinksJson || ""),
      ctaType: initialValues?.ctaType ?? (article?.ctaType || "none")
    }),
    [article, initialValues]
  );

  return useForm<SeoArticleEditorValues>({
    resolver: zodResolver(articleSchema) as never,
    defaultValues
  });
}
