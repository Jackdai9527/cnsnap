import { prisma } from "@/lib/db";
import type { NormalizedProduct } from "@/integrations/onebound/types";

export type RiskDetection = {
  risky: boolean;
  matches: string[];
};

export function normalizeSensitiveKeywords(input: string) {
  const unique = new Map<string, string>();
  input
    .split(/\r?\n|,/)
    .map((term) => term.trim())
    .filter(Boolean)
    .forEach((term) => {
      const key = term.toLowerCase();
      if (!unique.has(key)) unique.set(key, term);
    });

  return Array.from(unique.values());
}

export async function getSensitiveKeywords() {
  return prisma.sensitiveKeyword.findMany({ orderBy: { term: "asc" } });
}

export async function detectSensitiveContent(...values: unknown[]): Promise<RiskDetection> {
  const keywords = await getSensitiveKeywords();
  if (!keywords.length) return { risky: false, matches: [] };

  const text = values.map(valueToSearchText).join("\n").toLowerCase();
  const matches = keywords
    .map((keyword) => keyword.term)
    .filter((term) => text.includes(term.toLowerCase()));

  return {
    risky: matches.length > 0,
    matches
  };
}

export function productRiskPayload(product: NormalizedProduct) {
  return {
    title: product.title,
    sourceUrl: product.sourceUrl,
    sourceItemId: product.sourceItemId,
    shopName: product.shopName,
    shopUrl: product.shopUrl,
    attributes: product.attributes,
    descriptionHtml: product.descriptionHtml,
    skus: product.skus,
    raw: product.raw
  };
}

function valueToSearchText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return decodeBestEffort(value);
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value);
  try {
    return decodeBestEffort(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

function decodeBestEffort(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
