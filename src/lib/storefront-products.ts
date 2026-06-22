import "server-only";

import type { Prisma } from "@prisma/client";
import { cnyToUsd, getPricingSettings } from "@/lib/currency";
import type { NormalizedProduct } from "@/integrations/onebound/types";
import { prisma } from "@/lib/db";

type ProductCacheRecord = Prisma.ProductCacheGetPayload<Record<string, never>>;

export type StorefrontProductCard = {
  id: number;
  sourceUrl: string;
  mainImage: string;
  platform: string;
  title: string;
  priceCny: number;
  shopName?: string;
  sourceItemId: string;
};

export function productCacheToNormalizedProduct(product: ProductCacheRecord): NormalizedProduct {
  const attributes = isRecord(product.attributes) ? product.attributes : {};

  return {
    platform: product.platform,
    sourceItemId: product.sourceItemId,
    sourceUrl: product.sourceUrl,
    title: product.title,
    priceCny: Number(product.priceCny),
    priceUsd: Number(product.priceUsd),
    images: Array.isArray(product.images) ? (product.images as string[]) : [product.mainImage],
    mainImage: product.mainImage,
    shopName: product.sourceShopName ?? product.shopName ?? undefined,
    shopUrl: product.sourceShopUrl ?? product.shopUrl ?? undefined,
    domesticShippingCny: readDomesticShipping(attributes),
    skus: Array.isArray(product.skus) ? (product.skus as NormalizedProduct["skus"]) : [],
    attributes: stringifyRecord(attributes),
    descriptionHtml: product.descriptionHtml ?? undefined,
    raw: product.rawJson
  };
}

export function productCacheToStorefrontCard(product: ProductCacheRecord): StorefrontProductCard {
  return {
    id: product.id,
    sourceUrl: product.sourceUrl,
    mainImage: product.mainImage,
    platform: product.platform,
    title: product.title,
    priceCny: Number(product.priceCny),
    shopName: product.sourceShopName ?? product.shopName ?? undefined,
    sourceItemId: product.sourceItemId
  };
}

export async function getHomepageStorefrontProducts(limit = 16) {
  const products = await prisma.productCache.findMany({
    where: {
      isStorefrontActive: true,
      isHomepageFeatured: true
    },
    orderBy: [{ storefrontRank: "asc" }, { updatedAt: "desc" }],
    take: limit
  });

  if (products.length >= limit) {
    return products.map(productCacheToStorefrontCard);
  }

  const fallbackProducts = await prisma.productCache.findMany({
    where: {
      isStorefrontActive: true,
      ...(products.length
        ? {
            id: {
              notIn: products.map((item) => item.id)
            }
          }
        : {})
    },
    orderBy: [{ storefrontRank: "asc" }, { updatedAt: "desc" }],
    take: Math.max(limit - products.length, 0)
  });

  return [...products, ...fallbackProducts].map(productCacheToStorefrontCard);
}

export async function searchStorefrontProducts(params: {
  q?: string;
  platform?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  startPrice?: number;
  endPrice?: number;
}) {
  const q = params.q?.trim();
  const platform = params.platform && params.platform !== "all" ? params.platform : undefined;
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, Math.min(48, params.pageSize ?? 12));

  const where: Prisma.ProductCacheWhereInput = {
    isStorefrontActive: true,
    platform,
    priceCny: {
      gte: params.startPrice || undefined,
      lte: params.endPrice || undefined
    },
    OR: q
      ? [
          { title: { contains: q } },
          { shopName: { contains: q } },
          { sourceShopName: { contains: q } },
          { sourceItemId: { contains: q } }
        ]
      : undefined
  };

  const [items, total] = await Promise.all([
    prisma.productCache.findMany({
      where,
      orderBy: storefrontOrderBy(params.sort),
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.productCache.count({ where })
  ]);

  return {
    items: items.map(productCacheToNormalizedProduct),
    total,
    page,
    pageSize,
    hasNextPage: page * pageSize < total
  };
}

export async function upsertProductCacheFromNormalizedProduct(
  product: NormalizedProduct,
  options: {
    isStorefrontActive?: boolean;
    isHomepageFeatured?: boolean;
    storefrontRank?: number;
    importSource?: string;
    sourceShopId?: string;
    sourceShopName?: string;
    sourceShopUrl?: string;
  } = {}
) {
  const settings = await getPricingSettings();
  const sourceShopId = options.sourceShopId ?? readSourceShopId(product);
  const sourceShopName = options.sourceShopName ?? product.shopName ?? undefined;
  const sourceShopUrl = options.sourceShopUrl ?? product.shopUrl ?? undefined;
  const priceUsd = product.priceUsd > 0 ? product.priceUsd : cnyToUsd(product.priceCny, settings.exchangeRate);

  return prisma.productCache.upsert({
    where: {
      platform_sourceItemId: {
        platform: product.platform,
        sourceItemId: product.sourceItemId
      }
    },
    update: {
      sourceUrl: product.sourceUrl,
      title: product.title,
      mainImage: product.mainImage,
      images: product.images.length ? product.images : [product.mainImage],
      shopName: product.shopName,
      shopUrl: product.shopUrl,
      priceCny: product.priceCny,
      priceUsd,
      skus: product.skus,
      attributes: product.attributes,
      descriptionHtml: product.descriptionHtml,
      rawJson: product.raw as Prisma.InputJsonValue,
      cacheExpiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isStorefrontActive: options.isStorefrontActive ?? true,
      isHomepageFeatured: options.isHomepageFeatured ?? false,
      storefrontRank: options.storefrontRank ?? 0,
      importSource: options.importSource ?? "manual",
      sourceShopId,
      sourceShopName,
      sourceShopUrl
    },
    create: {
      platform: product.platform,
      sourceItemId: product.sourceItemId,
      sourceUrl: product.sourceUrl,
      title: product.title,
      mainImage: product.mainImage,
      images: product.images.length ? product.images : [product.mainImage],
      shopName: product.shopName,
      shopUrl: product.shopUrl,
      priceCny: product.priceCny,
      priceUsd,
      skus: product.skus,
      attributes: product.attributes,
      descriptionHtml: product.descriptionHtml,
      rawJson: product.raw as Prisma.InputJsonValue,
      cacheExpiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isStorefrontActive: options.isStorefrontActive ?? true,
      isHomepageFeatured: options.isHomepageFeatured ?? false,
      storefrontRank: options.storefrontRank ?? 0,
      importSource: options.importSource ?? "manual",
      sourceShopId,
      sourceShopName,
      sourceShopUrl
    }
  });
}

function storefrontOrderBy(sort?: string): Prisma.ProductCacheOrderByWithRelationInput[] {
  if (sort === "price_asc") return [{ priceCny: "asc" }, { storefrontRank: "asc" }, { updatedAt: "desc" }];
  if (sort === "price_desc") return [{ priceCny: "desc" }, { storefrontRank: "asc" }, { updatedAt: "desc" }];
  return [{ storefrontRank: "asc" }, { updatedAt: "desc" }];
}

function readDomesticShipping(attributes: Record<string, unknown>) {
  const value = attributes.domesticShippingCny;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : undefined;
}

function readSourceShopId(product: NormalizedProduct) {
  const shopIdFromAttributes = product.attributes.shopId;
  if (shopIdFromAttributes) return shopIdFromAttributes;

  const source = product.shopUrl ?? product.sourceUrl;
  if (!source) return undefined;
  const matched = source.match(/userid=(\d+)/i) || source.match(/shop\/(\d+)/i);
  return matched?.[1];
}

function stringifyRecord(input: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value == null ? "" : String(value)]));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
