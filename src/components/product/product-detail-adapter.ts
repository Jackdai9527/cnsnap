import type { NormalizedProduct } from "@/integrations/onebound/types";
import { buildSkuOptionGroups, findMatchingSku } from "@/lib/sku-options";
import type { ProductDetail, ProductSkuDetail } from "@/types/product-detail";

export function productDetailFromNormalized(product: NormalizedProduct, sourceUrl?: string): ProductDetail {
  const variants = buildSkuOptionGroups(product).map((group) => ({
    id: group.name,
    name: group.name,
    options: group.values.map((value) => ({
      id: value.key,
      label: value.label,
      image: value.image
    }))
  }));

  const skus: ProductSkuDetail[] = product.skus.length
    ? product.skus.map((sku) => {
        const optionIds = Object.fromEntries(
          variants.map((group) => {
            const matchedOption = group.options.find((option) =>
              sku.options?.some((skuOption) => `${skuOption.propertyId}:${skuOption.valueId}` === option.id) ||
              sku.propertiesName?.includes(option.id) ||
              sku.text.includes(option.label)
            );
            return [group.id, matchedOption?.id ?? ""];
          })
        );
        const priceCny = Number(sku.priceCny ?? product.priceCny);
        return {
          id: sku.id,
          optionIds,
          text: sku.text,
          priceCny,
          priceUsd: priceCny ? Number((priceCny / Math.max(product.priceCny / Math.max(product.priceUsd, 0.01), 0.01)).toFixed(2)) : product.priceUsd,
          stock: Number(sku.stock ?? 0),
          image: sku.options?.find((option) => option.image)?.image
        };
      })
    : [
        {
          id: "default",
          optionIds: variants[0]?.options[0] ? { [variants[0].id]: variants[0].options[0].id } : {},
          text: "Default SKU",
          priceCny: product.priceCny,
          priceUsd: product.priceUsd,
          stock: 999
        }
      ];

  return {
    id: `${product.platform}-${product.sourceItemId}`,
    sourcePlatform: product.platform,
    sourceUrl: sourceUrl ?? product.sourceUrl,
    sourceItemId: product.sourceItemId,
    title: product.title,
    images: Array.from(new Set([product.mainImage, ...product.images].filter(Boolean))).map((image, index) => ({
      src: image,
      highResSrc: image,
      alt: index === 0 ? product.title : `${product.title} image ${index + 1}`,
      width: 1000,
      height: 1000
    })),
    priceCny: product.priceCny,
    priceUsd: product.priceUsd,
    domesticShippingCny: Number(product.domesticShippingCny || product.attributes?.domesticShippingCny || 0),
    shopName: product.shopName ?? "Source shop",
    shopUrl: product.shopUrl,
    variants,
    skus: normalizeSkuAvailability(variants, skus, product),
    descriptionHtml: product.descriptionHtml || "<p>Product details are provided by the original marketplace seller.</p>",
    specs: Object.entries(product.attributes ?? {}).map(([name, value]) => ({ name, value })),
    category: "China marketplace product",
    riskFlags: [],
    relatedProducts: []
  };
}

function normalizeSkuAvailability(
  variants: ProductDetail["variants"],
  skus: ProductSkuDetail[],
  product: NormalizedProduct
) {
  if (!variants.length) return skus;
  return skus.map((sku) => {
    const selected = Object.fromEntries(Object.entries(sku.optionIds).filter(([, value]) => Boolean(value)));
    const matched = findMatchingSku(product, selected);
    return matched ? sku : sku;
  });
}
