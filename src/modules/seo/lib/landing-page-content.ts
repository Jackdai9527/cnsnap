import type { SeoFaqItem, SeoLandingPageRecord, SeoLandingPageSection } from "@/modules/seo/types";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function parseLandingSections(sectionsJson?: string | null) {
  if (!sectionsJson) return [] as SeoLandingPageSection[];
  try {
    const parsed = JSON.parse(sectionsJson) as Array<{ title?: string; description?: string; bullets?: string[] }>;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        title: String(item?.title || "").trim(),
        description: String(item?.description || "").trim(),
        bullets: Array.isArray(item?.bullets) ? item.bullets.map((bullet) => String(bullet).trim()).filter(Boolean) : []
      }))
      .filter((item) => item.title || item.description || item.bullets.length);
  } catch {
    return [];
  }
}

export function parseLandingFaqItems(faqJson?: string | null) {
  if (!faqJson) return [] as SeoFaqItem[];
  try {
    const parsed = JSON.parse(faqJson) as Array<{ question?: string; answer?: string }>;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        question: String(item?.question || "").trim(),
        answer: String(item?.answer || "").trim()
      }))
      .filter((item) => item.question && item.answer);
  } catch {
    return [];
  }
}

export function buildLandingPageHtml(page: Pick<SeoLandingPageRecord, "content" | "sectionsJson" | "faqJson" | "ctaText" | "ctaHref">) {
  const sections = parseLandingSections(page.sectionsJson);
  const faqItems = parseLandingFaqItems(page.faqJson);
  const chunks: string[] = [];
  const normalizedContent = (page.content || "").trim();
  const hasStructuredContent = sections.length > 0 || faqItems.length > 0 || Boolean(page.ctaText && page.ctaHref);
  const likelyLegacyIntroOnly = hasStructuredContent && normalizedContent.length > 0 && normalizedContent.length < 420;

  if (normalizedContent) {
    chunks.push(normalizedContent);
  }

  if (!likelyLegacyIntroOnly) {
    return chunks.join("");
  }

  if (sections.length) {
    chunks.push(
      sections
        .map((section) => {
          const bullets = section.bullets?.length
            ? `<ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>`
            : "";
          return `<section><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.description)}</p>${bullets}</section>`;
        })
        .join("")
    );
  }

  if (page.ctaText && page.ctaHref) {
    chunks.push(
      `<section><p><a href="${escapeHtml(page.ctaHref)}"><strong>${escapeHtml(page.ctaText)}</strong></a></p></section>`
    );
  }

  if (faqItems.length) {
    chunks.push(
      `<section><h2>FAQ</h2>${faqItems
        .map((item) => `<div><h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p></div>`)
        .join("")}</section>`
    );
  }

  return chunks.join("");
}
