"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SeoPageRecord } from "@/modules/seo/types";

const seoPageEditorSchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
  title: z.string().trim().min(1, "Title is required."),
  description: z.string().trim().min(1, "Description is required."),
  canonicalUrl: z.string().trim().optional(),
  robots: z.enum(["index,follow", "noindex,follow", "noindex,nofollow"]),
  ogTitle: z.string().trim().optional(),
  ogDescription: z.string().trim().optional(),
  ogImage: z.string().trim().optional(),
  twitterTitle: z.string().trim().optional(),
  twitterDescription: z.string().trim().optional(),
  twitterImage: z.string().trim().optional(),
  structuredDataJson: z.string().trim().optional(),
  enabled: z.boolean()
});

export type SeoPageEditorValues = z.infer<typeof seoPageEditorSchema>;

export function useSeoPageEditor(page: SeoPageRecord) {
  const defaultValues = useMemo<SeoPageEditorValues>(
    () => ({
      id: page.id,
      path: page.path,
      title: page.title,
      description: page.description,
      canonicalUrl: page.canonicalUrl || "",
      robots: page.robots || page.indexPolicy.robots,
      ogTitle: page.ogTitle || "",
      ogDescription: page.ogDescription || "",
      ogImage: page.ogImage || "",
      twitterTitle: page.twitterTitle || "",
      twitterDescription: page.twitterDescription || "",
      twitterImage: page.twitterImage || "",
      structuredDataJson: page.structuredDataJson || "",
      enabled: page.enabled
    }),
    [page]
  );

  return useForm<SeoPageEditorValues>({
    resolver: zodResolver(seoPageEditorSchema),
    defaultValues
  });
}
