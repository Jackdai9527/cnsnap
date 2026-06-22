"use client";

import { useMemo } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { buildLandingPageHtml } from "@/modules/seo/lib/landing-page-content";
import type { SeoLandingPageRecord, SeoLandingPageStatus, SeoLandingPageType, SeoRobotsValue } from "@/modules/seo/types";

const landingPageSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(5, "Title must be at least 5 characters."),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must use lowercase letters, numbers, and hyphens only."),
  localizedPath: z.string().trim().optional(),
  type: z.enum(["platform", "shipping_country", "campaign", "service", "custom"] satisfies SeoLandingPageType[]),
  path: z.string().trim().startsWith("/", "Path must start with '/'."),
  heroTitle: z.string().trim().min(1, "Hero title is required."),
  heroSubtitle: z.string().optional(),
  content: z.string().optional(),
  sectionsJson: z.string().optional(),
  faqJson: z.string().optional(),
  ctaText: z.string().optional(),
  ctaHref: z.string().refine((value) => !value || value.startsWith("/") || value.startsWith("https://"), "CTA href must start with '/' or 'https://'.").optional(),
  status: z.enum(["draft", "published", "archived"] satisfies SeoLandingPageStatus[]),
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
  structuredDataJson: z.string().optional()
});

export type SeoLandingPageEditorValues = z.infer<typeof landingPageSchema>;

export function useSeoLandingPageEditor(
  page?: SeoLandingPageRecord | null,
  initialValues?: Partial<SeoLandingPageEditorValues> | null
): UseFormReturn<SeoLandingPageEditorValues> {
  const derivedContent = page ? buildLandingPageHtml(page) : "";
  const defaultValues = useMemo<SeoLandingPageEditorValues>(
    () => ({
      id: initialValues?.id ?? page?.id,
      title: initialValues?.title ?? (page?.title || ""),
      slug: initialValues?.slug ?? (page?.slug || ""),
      localizedPath: initialValues?.localizedPath ?? (page?.localizedPath || ""),
      type: initialValues?.type ?? (page?.type || "platform"),
      path: initialValues?.path ?? (page?.path || ""),
      heroTitle: initialValues?.heroTitle ?? (page?.heroTitle || ""),
      heroSubtitle: initialValues?.heroSubtitle ?? (page?.heroSubtitle || ""),
      content: initialValues?.content ?? (derivedContent || "<p>Write your landing page content here.</p>"),
      sectionsJson: initialValues?.sectionsJson ?? (page?.sectionsJson || ""),
      faqJson: initialValues?.faqJson ?? (page?.faqJson || ""),
      ctaText: initialValues?.ctaText ?? (page?.ctaText || ""),
      ctaHref: initialValues?.ctaHref ?? (page?.ctaHref || ""),
      status: initialValues?.status ?? (page?.status || "draft"),
      language: initialValues?.language ?? (page?.language || "en"),
      translationGroupId: initialValues?.translationGroupId ?? (page?.translationGroupId || ""),
      sourceLanguage: initialValues?.sourceLanguage ?? (page?.sourceLanguage || page?.language || "en"),
      translatedFromId: initialValues?.translatedFromId ?? (page?.translatedFromId || ""),
      publishedAt: initialValues?.publishedAt ?? (page?.publishedAt ? page.publishedAt.slice(0, 16) : ""),
      seoTitle: initialValues?.seoTitle ?? (page?.seoTitle || ""),
      seoDescription: initialValues?.seoDescription ?? (page?.seoDescription || ""),
      canonicalUrl: initialValues?.canonicalUrl ?? (page?.canonicalUrl || ""),
      robots: initialValues?.robots ?? (page?.robots || "index,follow"),
      ogTitle: initialValues?.ogTitle ?? (page?.ogTitle || ""),
      ogDescription: initialValues?.ogDescription ?? (page?.ogDescription || ""),
      ogImage: initialValues?.ogImage ?? (page?.ogImage || ""),
      twitterTitle: initialValues?.twitterTitle ?? (page?.twitterTitle || ""),
      twitterDescription: initialValues?.twitterDescription ?? (page?.twitterDescription || ""),
      twitterImage: initialValues?.twitterImage ?? (page?.twitterImage || ""),
      structuredDataJson: initialValues?.structuredDataJson ?? (page?.structuredDataJson || "")
    }),
    [derivedContent, initialValues, page]
  );

  return useForm<SeoLandingPageEditorValues>({
    resolver: zodResolver(landingPageSchema) as never,
    defaultValues
  });
}
