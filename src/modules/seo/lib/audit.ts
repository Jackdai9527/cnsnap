import { getSeoArticles, getSeoLandingPages, getSeoRedirects, readSeoStore } from "@/modules/seo/lib/article-store";
import type { SeoAuditIssue, SeoLandingPageRecord, SeoPageMeta, SeoRedirect } from "@/modules/seo/types";

const MOCK_AUDIT_TIME = "2026-06-14T12:00:00.000Z";

export async function getSeoAuditIssues(): Promise<SeoAuditIssue[]> {
  const [store, articles, landingPages, redirects] = await Promise.all([
    readSeoStore(),
    getSeoArticles(),
    getSeoLandingPages(),
    getSeoRedirects()
  ]);

  const issues: SeoAuditIssue[] = [];

  for (const page of store.pageMetas) {
    issues.push(...auditPageMeta(page));
  }

  for (const article of articles) {
    const title = (article.seoTitle || "").trim();
    const description = (article.seoDescription || "").trim();
    if (!title) {
      issues.push(issue("warning", "article", "missing_seo_title", article.id, article.title, `/blog/${article.slug}`, "Article is missing SEO title.", "Use article title or a shorter search-facing variant."));
    }
    if (!description) {
      issues.push(issue("warning", "article", "missing_meta_description", article.id, article.title, `/blog/${article.slug}`, "Article is missing meta description.", "Use the excerpt or write a summary under 160 characters."));
    }
    if (title.length > 60) {
      issues.push(issue("notice", "article", "title_too_long", article.id, article.title, `/blog/${article.slug}`, "Article SEO title is longer than 60 characters.", "Trim the title to improve SERP presentation."));
    }
    if (description.length > 160) {
      issues.push(issue("notice", "article", "description_too_long", article.id, article.title, `/blog/${article.slug}`, "Article meta description is longer than 160 characters.", "Shorten the description to reduce truncation risk."));
    }
    if (!(article.canonicalUrl || "").trim()) {
      issues.push(issue("notice", "article", "missing_canonical", article.id, article.title, `/blog/${article.slug}`, "Article is missing explicit canonical URL.", "Set canonical URL to match the public blog route."));
    }
    if (article.robots !== "index,follow") {
      issues.push(issue("notice", "article", "noindex_warning", article.id, article.title, `/blog/${article.slug}`, "Article is not indexable.", "Confirm noindex is intentional before keeping it out of search."));
    }
    if (!(article.faqJson || "").trim()) {
      issues.push(issue("notice", "article", "missing_faq", article.id, article.title, `/blog/${article.slug}`, "Article has no FAQ block.", "Add FAQ JSON if the topic benefits from question-based search intent."));
    }
    if (article.ctaType === "none") {
      issues.push(issue("warning", "article", "missing_cta", article.id, article.title, `/blog/${article.slug}`, "Article does not link to a next-step CTA flow.", "Choose a CTA type that matches the article intent."));
    }
    if (!(article.ogImage || "").trim()) {
      issues.push(issue("notice", "article", "missing_og_image", article.id, article.title, `/blog/${article.slug}`, "Article is missing OG image override.", "Add an OG image if you need stronger social previews."));
    }
    if (article.includeInSitemap && article.robots !== "index,follow") {
      issues.push(issue("error", "article", "sitemap_noindex_conflict", article.id, article.title, `/blog/${article.slug}`, "Article appears sitemap-eligible while robots is not index,follow.", "Align sitemap eligibility with index policy."));
    }
  }

  for (const landingPage of landingPages) {
    issues.push(...auditLandingPage(landingPage));
  }

  issues.push(...duplicateIssues(articles.map((article) => ({ id: article.id, title: article.title, slug: article.slug, path: `/blog/${article.slug}`, area: "article" as const }))));
  issues.push(...duplicateIssues(landingPages.map((page) => ({ id: page.id, title: page.title, slug: page.slug, path: page.path, area: "landing_page" as const }))));

  issues.push(...auditRedirects(redirects));

  return issues.sort((a, b) => severityRank(a.severity) - severityRank(b.severity) || b.createdAt.localeCompare(a.createdAt));
}

export async function getSeoAuditSummary() {
  const issues = await getSeoAuditIssues();
  return {
    total: issues.length,
    errors: issues.filter((item) => item.severity === "error").length,
    warnings: issues.filter((item) => item.severity === "warning").length,
    notices: issues.filter((item) => item.severity === "notice").length,
    missingTitles: issues.filter((item) => item.rule === "missing_seo_title").length,
    missingDescriptions: issues.filter((item) => item.rule === "missing_meta_description").length,
    sitemapConflicts: issues.filter((item) => item.rule === "sitemap_noindex_conflict").length,
    latestIssues: issues.slice(0, 8)
  };
}

function auditPageMeta(page: SeoPageMeta) {
  const issues: SeoAuditIssue[] = [];
  if (!page.title.trim()) {
    issues.push(issue("warning", "page", "missing_seo_title", page.id, page.path, page.path, "Managed SEO page is missing title.", "Populate the page SEO title."));
  }
  if (!page.description.trim()) {
    issues.push(issue("warning", "page", "missing_meta_description", page.id, page.path, page.path, "Managed SEO page is missing description.", "Populate the page meta description."));
  }
  if (page.title.trim().length > 60) {
    issues.push(issue("notice", "page", "title_too_long", page.id, page.path, page.path, "Managed SEO page title is longer than 60 characters.", "Trim title length to improve SERP display."));
  }
  if (page.description.trim().length > 160) {
    issues.push(issue("notice", "page", "description_too_long", page.id, page.path, page.path, "Managed SEO page description is longer than 160 characters.", "Shorten meta description to reduce truncation."));
  }
  if (!(page.canonicalUrl || "").trim()) {
    issues.push(issue("notice", "page", "missing_canonical", page.id, page.path, page.path, "Managed SEO page is missing canonical URL.", "Set canonical URL to the public route."));
  }
  if (page.robots && page.robots !== "index,follow") {
    issues.push(issue("notice", "page", "noindex_warning", page.id, page.path, page.path, "Managed SEO page is not indexable.", "Confirm noindex is intentional."));
  }
  if (!(page.ogImage || "").trim()) {
    issues.push(issue("notice", "page", "missing_og_image", page.id, page.path, page.path, "Managed SEO page is missing OG image override.", "Add OG image if needed for social sharing."));
  }
  return issues;
}

function auditLandingPage(page: SeoLandingPageRecord) {
  const issues: SeoAuditIssue[] = [];
  const title = (page.seoTitle || "").trim();
  const description = (page.seoDescription || "").trim();
  if (!title) {
    issues.push(issue("warning", "landing_page", "missing_seo_title", page.id, page.title, page.path, "Landing page is missing SEO title.", "Use hero title or a search-facing SEO title."));
  }
  if (!description) {
    issues.push(issue("warning", "landing_page", "missing_meta_description", page.id, page.title, page.path, "Landing page is missing meta description.", "Use hero subtitle or add a concise description."));
  }
  if (title.length > 60) {
    issues.push(issue("notice", "landing_page", "title_too_long", page.id, page.title, page.path, "Landing page SEO title is longer than 60 characters.", "Trim title length to improve SERP display."));
  }
  if (description.length > 160) {
    issues.push(issue("notice", "landing_page", "description_too_long", page.id, page.title, page.path, "Landing page meta description is longer than 160 characters.", "Shorten description to reduce truncation."));
  }
  if (!(page.canonicalUrl || "").trim()) {
    issues.push(issue("notice", "landing_page", "missing_canonical", page.id, page.title, page.path, "Landing page is missing explicit canonical URL.", "Set canonical URL to the public landing path."));
  }
  if (page.robots !== "index,follow") {
    issues.push(issue("notice", "landing_page", "noindex_warning", page.id, page.title, page.path, "Landing page is not indexable.", "Confirm noindex is intentional for this landing page."));
  }
  if (!(page.faqJson || "").trim()) {
    issues.push(issue("notice", "landing_page", "missing_faq", page.id, page.title, page.path, "Landing page has no FAQ block.", "Add FAQ JSON to capture question-led search intent."));
  }
  if (!(page.ctaText || "").trim() || !(page.ctaHref || "").trim()) {
    issues.push(issue("warning", "landing_page", "missing_cta", page.id, page.title, page.path, "Landing page is missing CTA text or CTA link.", "Add a CTA that moves visitors into a live service workflow."));
  }
  if (!(page.ogImage || "").trim()) {
    issues.push(issue("notice", "landing_page", "missing_og_image", page.id, page.title, page.path, "Landing page is missing OG image override.", "Add an OG image if custom social previews matter for this page."));
  }
  if (page.includeInSitemap && page.robots !== "index,follow") {
    issues.push(issue("error", "landing_page", "sitemap_noindex_conflict", page.id, page.title, page.path, "Landing page appears sitemap-eligible while robots is not index,follow.", "Align sitemap eligibility with robots policy."));
  }
  return issues;
}

function auditRedirects(redirects: SeoRedirect[]) {
  const issues: SeoAuditIssue[] = [];
  const redirectMap = new Map(redirects.filter((redirect) => redirect.enabled).map((redirect) => [redirect.fromPath, redirect.toPath]));

  for (const redirect of redirects) {
    if (!redirect.enabled) continue;
    if (redirectMap.has(redirect.toPath)) {
      issues.push(issue("notice", "redirect", "redirect_chain", redirect.id, redirect.fromPath, redirect.fromPath, "Redirect target points to another redirect, creating a chain.", "Point directly to the final destination when possible."));
    }
    if (redirect.fromPath === redirect.toPath) {
      issues.push(issue("error", "redirect", "redirect_loop", redirect.id, redirect.fromPath, redirect.fromPath, "Redirect source and target are the same.", "Update the redirect target to avoid a loop."));
    } else {
      const secondHop = redirectMap.get(redirect.toPath);
      if (secondHop === redirect.fromPath) {
        issues.push(issue("error", "redirect", "redirect_loop", redirect.id, redirect.fromPath, redirect.fromPath, "Redirect appears to participate in a loop.", "Break the loop by updating one of the redirect targets."));
      }
    }
  }

  return issues;
}

function duplicateIssues(items: Array<{ id: string; title: string; slug: string; path: string; area: "article" | "landing_page" }>) {
  const issues: SeoAuditIssue[] = [];
  const slugMap = new Map<string, typeof items>();
  const titleMap = new Map<string, typeof items>();

  for (const item of items) {
    const slugKey = item.slug.trim().toLowerCase();
    const titleKey = item.title.trim().toLowerCase();
    slugMap.set(slugKey, [...(slugMap.get(slugKey) || []), item]);
    titleMap.set(titleKey, [...(titleMap.get(titleKey) || []), item]);
  }

  for (const [, matches] of slugMap) {
    if (matches.length < 2) continue;
    for (const match of matches) {
      issues.push(issue("warning", match.area, "duplicate_slug", match.id, match.title, match.path, "Duplicate slug detected inside the same SEO content area.", "Rename one of the entries to avoid overlap."));
    }
  }

  for (const [, matches] of titleMap) {
    if (matches.length < 2) continue;
    for (const match of matches) {
      issues.push(issue("notice", match.area, "duplicate_title", match.id, match.title, match.path, "Duplicate title detected inside the same SEO content area.", "Differentiate titles to reduce cannibalization risk."));
    }
  }

  return issues;
}

function issue(
  severity: SeoAuditIssue["severity"],
  area: SeoAuditIssue["area"],
  rule: SeoAuditIssue["rule"],
  entityId: string,
  entityLabel: string,
  path: string | undefined,
  message: string,
  recommendation?: string
): SeoAuditIssue {
  return {
    id: `${area}-${rule}-${entityId}`,
    severity,
    area,
    rule,
    entityId,
    entityLabel,
    path,
    message,
    recommendation,
    createdAt: MOCK_AUDIT_TIME
  };
}

function severityRank(severity: SeoAuditIssue["severity"]) {
  if (severity === "error") return 0;
  if (severity === "warning") return 1;
  return 2;
}
