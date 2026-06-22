import { prisma } from "@/lib/db";
import type { NormalizedProduct } from "@/integrations/onebound/types";
import { ProductDetailPdp } from "@/components/product/ProductDetailPdp";
import { productDetailFromNormalized } from "@/components/product/product-detail-adapter";

export async function ProductPurchasePage({ product, sourceUrl }: { product: NormalizedProduct; sourceUrl?: string }) {
  await ensureProductCache(product, sourceUrl);
  return <ProductDetailPdp product={productDetailFromNormalized(product, sourceUrl)} />;
}

async function ensureProductCache(product: NormalizedProduct, sourceUrl?: string) {
  const cacheExpiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const data = {
    sourceUrl: sourceUrl ?? product.sourceUrl,
    title: product.title,
    mainImage: product.mainImage,
    images: product.images.length ? product.images : [product.mainImage],
    shopName: product.shopName,
    shopUrl: product.shopUrl,
    priceCny: product.priceCny,
    priceUsd: product.priceUsd,
    skus: product.skus,
    attributes: product.attributes,
    descriptionHtml: product.descriptionHtml,
    rawJson: product.raw as object,
    cacheExpiredAt
  };

  return prisma.productCache.upsert({
    where: {
      platform_sourceItemId: {
        platform: product.platform,
        sourceItemId: product.sourceItemId
      }
    },
    update: data,
    create: {
      platform: product.platform,
      sourceItemId: product.sourceItemId,
      ...data
    }
  });
}
