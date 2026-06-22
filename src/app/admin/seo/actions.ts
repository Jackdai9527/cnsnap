"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/admin-session";
import { getLocaleConfigsSnapshot, saveLocaleConfigsSnapshot } from "@/lib/i18n/locale-config-store";
import {
  calculateReadingTime,
  deleteSeoArticle,
  deleteSeoArticleTag,
  deleteSeoLandingPage,
  deleteSeoRedirect,
  extractTableOfContents,
  getSeoArticleById,
  getSeoLandingPageById,
  getSeoRedirectById,
  upsertSeoArticle,
  upsertSeoArticleCategory,
  upsertSeoArticleTag,
  upsertSeoLandingPage,
  upsertSeoRedirect
} from "@/modules/seo/lib/article-store";
import type {
  SeoArticleCategory,
  SeoArticleFormValues,
  SeoArticleTag,
  SeoLandingPageFormValues,
  SeoRedirectFormValues
} from "@/modules/seo/types";

function revalidateSeoPaths() {
  [
    "/admin/seo",
    "/admin/seo/pages",
    "/admin/seo/settings",
    "/admin/seo/sitemap-robots",
    "/admin/seo/articles",
    "/admin/seo/articles/new",
    "/admin/seo/landing-pages",
    "/admin/seo/landing-pages/new",
    "/admin/seo/redirects",
    "/admin/seo/audit",
    "/admin/seo/article-categories",
    "/admin/seo/article-tags",
    "/blog"
  ].forEach((path) => revalidatePath(path));
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
}

export async function updateSeoPageMock(formData: FormData) {
  await requirePermission("seo.manage");

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  if (!title) throw new Error("Title is required.");
  if (!description) throw new Error("Description is required.");

  revalidateSeoPaths();
}

export async function updateSeoSettingsMock(formData: FormData) {
  await requirePermission("seo.manage");

  const siteName = String(formData.get("siteName") || "").trim();
  const canonicalBaseUrl = String(formData.get("canonicalBaseUrl") || "").trim();
  if (!siteName) throw new Error("Site name is required.");
  if (!canonicalBaseUrl) throw new Error("Canonical base URL is required.");

  revalidateSeoPaths();
}

export async function updateSeoLocaleConfigMock(formData: FormData) {
  await requirePermission("seo.manage");

  const locale = String(formData.get("locale") || "").trim();
  if (!locale) throw new Error("Locale is required.");

  const [configs] = await Promise.all([getLocaleConfigsSnapshot()]);
  const nextConfigs = configs.map((config) => {
    if (config.locale !== locale) {
      return config;
    }

    return {
      ...config,
      enabled: readBooleanField(formData, "enabled"),
      frontendEnabled: readBooleanField(formData, "frontendEnabled"),
      seoEnabled: readBooleanField(formData, "seoEnabled"),
      sortOrder: Math.max(1, Number(formData.get("sortOrder") || config.sortOrder)),
      isDefault: readBooleanField(formData, "isDefault")
    };
  });

  const normalized = nextConfigs.map((config) => ({
    ...config,
    isDefault: config.locale === "en" ? true : config.isDefault && !nextConfigs.some((item) => item.locale === "en" && item.isDefault)
  }));

  await saveLocaleConfigsSnapshot(normalized);
  revalidateSeoPaths();
  revalidatePath("/", "layout");
}

function readJsonArrayField(formData: FormData, key: string) {
  const raw = String(formData.get(key) || "").trim();
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error();
    return raw;
  } catch {
    throw new Error(`${key} must be a valid JSON array.`);
  }
}

function readBooleanField(formData: FormData, key: string) {
  const value = String(formData.get(key) || "").trim();
  return value === "true" || value === "1" || value === "on";
}

function readArticleFormValues(formData: FormData): SeoArticleFormValues {
  const title = String(formData.get("title") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const excerpt = String(formData.get("excerpt") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const robots = String(formData.get("robots") || "").trim() as SeoArticleFormValues["robots"];
  const status = String(formData.get("status") || "").trim() as SeoArticleFormValues["status"];
  const language = String(formData.get("language") || "en").trim();

  if (title.length < 5) throw new Error("Title must be at least 5 characters.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Slug must use lowercase letters, numbers, and hyphens only.");
  if (!excerpt) throw new Error("Excerpt is required.");
  if (content.replace(/<[^>]+>/g, " ").trim().length < 300) throw new Error("Content must be at least 300 characters.");
  if (!robots) throw new Error("Robots is required.");
  if (!status) throw new Error("Status is required.");

  const tagIds = formData.getAll("tagIds").map((value) => String(value)).filter(Boolean);
  const relatedArticleIds = formData.getAll("relatedArticleIds").map((value) => String(value)).filter(Boolean);

  return {
    id: String(formData.get("id") || "").trim() || undefined,
    title,
    slug,
    localizedSlug: String(formData.get("localizedSlug") || "").trim(),
    excerpt,
    content,
    coverImage: String(formData.get("coverImage") || "").trim(),
    categoryId: String(formData.get("categoryId") || "").trim(),
    tagIds,
    status,
    language: language || "en",
    translationGroupId: String(formData.get("translationGroupId") || "").trim() || undefined,
    sourceLanguage: String(formData.get("sourceLanguage") || "").trim() || undefined,
    translatedFromId: String(formData.get("translatedFromId") || "").trim() || undefined,
    publishedAt: String(formData.get("publishedAt") || "").trim(),
    seoTitle: String(formData.get("seoTitle") || "").trim(),
    seoDescription: String(formData.get("seoDescription") || "").trim(),
    canonicalUrl: String(formData.get("canonicalUrl") || "").trim(),
    robots,
    ogTitle: String(formData.get("ogTitle") || "").trim(),
    ogDescription: String(formData.get("ogDescription") || "").trim(),
    ogImage: String(formData.get("ogImage") || "").trim(),
    twitterTitle: String(formData.get("twitterTitle") || "").trim(),
    twitterDescription: String(formData.get("twitterDescription") || "").trim(),
    twitterImage: String(formData.get("twitterImage") || "").trim(),
    faqJson: readJsonArrayField(formData, "faqJson"),
    relatedArticleIds,
    relatedLinksJson: readJsonArrayField(formData, "relatedLinksJson"),
    ctaType: String(formData.get("ctaType") || "none").trim() as SeoArticleFormValues["ctaType"]
  };
}

export async function createSeoArticleMock(formData: FormData) {
  await requirePermission("seo.manage");
  const values = readArticleFormValues(formData);
  const article = await upsertSeoArticle(values);
  revalidateSeoPaths();
  revalidatePath(`/blog/${article.slug}`);
}

export async function updateSeoArticleMock(formData: FormData) {
  await requirePermission("seo.manage");
  const values = readArticleFormValues(formData);
  if (!values.id) throw new Error("Article id is required.");
  const article = await upsertSeoArticle(values);
  revalidateSeoPaths();
  revalidatePath(`/blog/${article.slug}`);
}

export async function archiveSeoArticleMock(formData: FormData) {
  await requirePermission("seo.manage");
  const id = String(formData.get("id") || "").trim();
  const article = await getSeoArticleById(id);
  if (!article) throw new Error("Article not found.");
  await upsertSeoArticle({
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    coverImage: article.coverImage || "",
    categoryId: article.categoryId,
    tagIds: article.tagIds,
    status: "archived",
    language: article.language,
    publishedAt: article.publishedAt || "",
    seoTitle: article.seoTitle || "",
    seoDescription: article.seoDescription || "",
    canonicalUrl: article.canonicalUrl || "",
    robots: article.robots,
    ogTitle: article.ogTitle || "",
    ogDescription: article.ogDescription || "",
    ogImage: article.ogImage || "",
    twitterTitle: article.twitterTitle || "",
    twitterDescription: article.twitterDescription || "",
    twitterImage: article.twitterImage || "",
    faqJson: article.faqJson || "",
    relatedArticleIds: article.relatedArticleIds || [],
    relatedLinksJson: article.relatedLinksJson || "",
    ctaType: article.ctaType
  });
  revalidateSeoPaths();
}

export async function deleteSeoArticleMock(formData: FormData) {
  await requirePermission("seo.manage");
  const id = String(formData.get("id") || "").trim();
  await deleteSeoArticle(id);
  revalidateSeoPaths();
}

function readLandingPageFormValues(formData: FormData): SeoLandingPageFormValues {
  const title = String(formData.get("title") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const type = String(formData.get("type") || "").trim() as SeoLandingPageFormValues["type"];
  const path = String(formData.get("path") || "").trim();
  const heroTitle = String(formData.get("heroTitle") || "").trim();
  const heroSubtitle = String(formData.get("heroSubtitle") || "").trim();
  const robots = String(formData.get("robots") || "").trim() as SeoLandingPageFormValues["robots"];
  const status = String(formData.get("status") || "").trim() as SeoLandingPageFormValues["status"];
  const language = String(formData.get("language") || "en").trim();
  const ctaHref = String(formData.get("ctaHref") || "").trim();

  if (title.length < 5) throw new Error("Title must be at least 5 characters.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Slug must use lowercase letters, numbers, and hyphens only.");
  if (!type) throw new Error("Type is required.");
  if (!path || !path.startsWith("/")) throw new Error("Path must start with '/'.");
  if (!heroTitle) throw new Error("Hero title is required.");
  if (!status) throw new Error("Status is required.");
  if (ctaHref && !/^\/|^https:\/\//.test(ctaHref)) throw new Error("CTA href must start with '/' or 'https://'.");

  return {
    id: String(formData.get("id") || "").trim() || undefined,
    title,
    slug,
    localizedPath: String(formData.get("localizedPath") || "").trim(),
    type,
    path,
    heroTitle,
    heroSubtitle,
    content: String(formData.get("content") || "").trim(),
    sectionsJson: readJsonArrayField(formData, "sectionsJson"),
    faqJson: readJsonArrayField(formData, "faqJson"),
    ctaText: String(formData.get("ctaText") || "").trim(),
    ctaHref,
    status,
    language: language || "en",
    translationGroupId: String(formData.get("translationGroupId") || "").trim() || undefined,
    sourceLanguage: String(formData.get("sourceLanguage") || "").trim() || undefined,
    translatedFromId: String(formData.get("translatedFromId") || "").trim() || undefined,
    publishedAt: String(formData.get("publishedAt") || "").trim(),
    seoTitle: String(formData.get("seoTitle") || "").trim(),
    seoDescription: String(formData.get("seoDescription") || "").trim(),
    canonicalUrl: String(formData.get("canonicalUrl") || "").trim(),
    robots,
    ogTitle: String(formData.get("ogTitle") || "").trim(),
    ogDescription: String(formData.get("ogDescription") || "").trim(),
    ogImage: String(formData.get("ogImage") || "").trim(),
    twitterTitle: String(formData.get("twitterTitle") || "").trim(),
    twitterDescription: String(formData.get("twitterDescription") || "").trim(),
    twitterImage: String(formData.get("twitterImage") || "").trim(),
    structuredDataJson: String(formData.get("structuredDataJson") || "").trim()
  };
}

function readRedirectFormValues(formData: FormData): SeoRedirectFormValues {
  const fromPath = String(formData.get("fromPath") || "").trim();
  const toPath = String(formData.get("toPath") || "").trim();
  const statusCode = Number(formData.get("statusCode") || 301) as SeoRedirectFormValues["statusCode"];
  const forbiddenRoots = ["/admin", "/api", "/account", "/checkout", "/cart"];

  if (!fromPath || !fromPath.startsWith("/")) throw new Error("From path must start with '/'.");
  if (!toPath || (!toPath.startsWith("/") && !toPath.startsWith("https://"))) throw new Error("To path must start with '/' or 'https://'.");
  if (statusCode !== 301 && statusCode !== 302) throw new Error("Status code must be 301 or 302.");
  if (fromPath === toPath) throw new Error("From path cannot be the same as to path.");
  if (forbiddenRoots.includes(fromPath)) throw new Error("Protected business roots cannot be used as redirect source.");

  return {
    id: String(formData.get("id") || "").trim() || undefined,
    fromPath,
    toPath,
    statusCode,
    enabled: readBooleanField(formData, "enabled")
  };
}

export async function createSeoLandingPageMock(formData: FormData) {
  await requirePermission("seo.manage");
  const values = readLandingPageFormValues(formData);
  const page = await upsertSeoLandingPage(values);
  revalidateSeoPaths();
  revalidatePath(page.path);
}

export async function updateSeoLandingPageMock(formData: FormData) {
  await requirePermission("seo.manage");
  const values = readLandingPageFormValues(formData);
  if (!values.id) throw new Error("Landing page id is required.");
  const page = await upsertSeoLandingPage(values);
  revalidateSeoPaths();
  revalidatePath(page.path);
}

export async function archiveSeoLandingPageMock(formData: FormData) {
  await requirePermission("seo.manage");
  const id = String(formData.get("id") || "").trim();
  const page = await getSeoLandingPageById(id);
  if (!page) throw new Error("Landing page not found.");
  await upsertSeoLandingPage({
    id: page.id,
    title: page.title,
    slug: page.slug,
    type: page.type,
    path: page.path,
    heroTitle: page.heroTitle,
    heroSubtitle: page.heroSubtitle || "",
    content: page.content,
    sectionsJson: page.sectionsJson || "",
    faqJson: page.faqJson || "",
    ctaText: page.ctaText || "",
    ctaHref: page.ctaHref || "",
    status: "archived",
    language: page.language,
    publishedAt: page.publishedAt || "",
    seoTitle: page.seoTitle || "",
    seoDescription: page.seoDescription || "",
    canonicalUrl: page.canonicalUrl || "",
    robots: page.robots,
    ogTitle: page.ogTitle || "",
    ogDescription: page.ogDescription || "",
    ogImage: page.ogImage || "",
    twitterTitle: page.twitterTitle || "",
    twitterDescription: page.twitterDescription || "",
    twitterImage: page.twitterImage || "",
    structuredDataJson: page.structuredDataJson || ""
  });
  revalidateSeoPaths();
  revalidatePath(page.path);
}

export async function deleteSeoLandingPageMock(formData: FormData) {
  await requirePermission("seo.manage");
  const id = String(formData.get("id") || "").trim();
  await deleteSeoLandingPage(id);
  revalidateSeoPaths();
}

export async function saveSeoRedirectMock(formData: FormData) {
  await requirePermission("seo.manage");
  await upsertSeoRedirect(readRedirectFormValues(formData));
  revalidateSeoPaths();
}

export async function toggleSeoRedirectMock(formData: FormData) {
  await requirePermission("seo.manage");
  const id = String(formData.get("id") || "").trim();
  const redirect = await getSeoRedirectById(id);
  if (!redirect) throw new Error("Redirect not found.");
  await upsertSeoRedirect({
    id: redirect.id,
    fromPath: redirect.fromPath,
    toPath: redirect.toPath,
    statusCode: redirect.statusCode,
    enabled: !redirect.enabled
  });
  revalidateSeoPaths();
}

export async function deleteSeoRedirectMock(formData: FormData) {
  await requirePermission("seo.manage");
  const id = String(formData.get("id") || "").trim();
  await deleteSeoRedirect(id);
  revalidateSeoPaths();
}

export async function saveSeoArticleCategoryMock(formData: FormData) {
  await requirePermission("seo.manage");
  const now = new Date().toISOString();
  const slug = String(formData.get("slug") || "").trim();
  const category: SeoArticleCategory = {
    id: String(formData.get("id") || "").trim() || `category-${slug}`,
    name: String(formData.get("name") || "").trim(),
    slug,
    localizedSlug: String(formData.get("localizedSlug") || "").trim() || undefined,
    description: String(formData.get("description") || "").trim(),
    seoTitle: String(formData.get("seoTitle") || "").trim() || undefined,
    seoDescription: String(formData.get("seoDescription") || "").trim() || undefined,
    language: String(formData.get("language") || "en").trim() || "en",
    translationGroupId: String(formData.get("translationGroupId") || "").trim() || undefined,
    translatedFromId: String(formData.get("translatedFromId") || "").trim() || undefined,
    sourceLanguage: String(formData.get("language") || "en").trim() || "en",
    sortOrder: Number(formData.get("sortOrder") || 0),
    status: formData.get("status") === "disabled" ? "disabled" : "active",
    createdAt: String(formData.get("createdAt") || "").trim() || now,
    updatedAt: now
  };
  if (!category.name) throw new Error("Category name is required.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category.slug)) throw new Error("Category slug must use lowercase letters, numbers, and hyphens only.");
  await upsertSeoArticleCategory(category);
  revalidateSeoPaths();
}

export async function saveSeoArticleTagMock(formData: FormData) {
  await requirePermission("seo.manage");
  const now = new Date().toISOString();
  const tag: SeoArticleTag = {
    id: String(formData.get("id") || "").trim() || `tag-${String(formData.get("slug") || "").trim()}`,
    name: String(formData.get("name") || "").trim(),
    slug: String(formData.get("slug") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    createdAt: String(formData.get("createdAt") || "").trim() || now,
    updatedAt: now
  };
  if (!tag.name) throw new Error("Tag name is required.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tag.slug)) throw new Error("Tag slug must use lowercase letters, numbers, and hyphens only.");
  await upsertSeoArticleTag(tag);
  revalidateSeoPaths();
}

export async function deleteSeoArticleTagMock(formData: FormData) {
  await requirePermission("seo.manage");
  const id = String(formData.get("id") || "").trim();
  await deleteSeoArticleTag(id);
  revalidateSeoPaths();
}

export async function generateSeoSlugMock(formData: FormData) {
  await requirePermission("seo.manage");
  const title = String(formData.get("title") || "").trim().toLowerCase();
  const slug = title
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug;
}

export async function generateSeoLandingPathMock(formData: FormData) {
  await requirePermission("seo.manage");
  const type = String(formData.get("type") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  if (!type) throw new Error("Type is required.");
  if (!slug) throw new Error("Slug is required.");

  switch (type) {
    case "platform":
      return `/platforms/${slug}`;
    case "shipping_country":
      return `/shipping-to/${slug}`;
    case "campaign":
      return `/campaign/${slug}`;
    case "service":
      return `/services/${slug}`;
    default:
      return `/${slug}`;
  }
}

export async function calculateReadingTimeMock(formData: FormData) {
  await requirePermission("seo.manage");
  return calculateReadingTime(String(formData.get("content") || ""));
}

export async function generateTableOfContentsMock(formData: FormData) {
  await requirePermission("seo.manage");
  return extractTableOfContents(String(formData.get("content") || ""));
}
