import type { NormalizedProduct, ProductSku } from "@/integrations/onebound/types";

export type SkuOptionValue = {
  key: string;
  propertyId: string;
  valueId: string;
  label: string;
  image?: string;
};

export type SkuOptionGroup = {
  name: string;
  values: SkuOptionValue[];
};

type RawProduct = {
  item?: {
    prop_imgs?: { prop_img?: Array<{ properties?: string; url?: string }> };
    props_imgs?: { prop_img?: Array<{ properties?: string; url?: string }> };
    props_img?: Record<string, string>;
    property_alias?: string;
    props_name?: string;
    props_list?: Record<string, string>;
  };
};

export function buildSkuOptionGroups(product: NormalizedProduct): SkuOptionGroup[] {
  const imageMap = buildPropertyImageMap(product.raw);
  const groups = new Map<string, SkuOptionGroup>();

  product.skus.forEach((sku) => {
    parseSkuOptions(sku).forEach((option) => {
      const normalizedName = normalizeSkuPropertyName(option.name);
      const group = groups.get(normalizedName) ?? { name: normalizedName, values: [] };
      const key = `${option.propertyId}:${option.valueId}`;
      if (!group.values.some((value) => value.key === key)) {
        group.values.push({
          key,
          propertyId: option.propertyId,
          valueId: option.valueId,
          label: option.value,
          image: option.image ?? imageMap.get(key)
        });
      }
      groups.set(normalizedName, group);
    });
  });

  if (!groups.size) {
    return [
      {
        name: "Specification",
        values: product.skus.map((sku) => ({
          key: sku.id,
          propertyId: "sku",
          valueId: sku.id,
          label: sku.text
        }))
      }
    ];
  }

  return Array.from(groups.values()).sort((a, b) => groupSortWeight(a.name) - groupSortWeight(b.name));
}

export function findMatchingSku(product: NormalizedProduct, selected: Record<string, string>) {
  const selectedKeys = Object.values(selected).filter(Boolean);
  return product.skus.find((sku) => {
    const skuKeys = parseSkuOptions(sku).map((option) => `${option.propertyId}:${option.valueId}`);
    return selectedKeys.every((key) => skuKeys.includes(key));
  });
}

export function parseSkuOptions(sku: ProductSku) {
  if (sku.options?.length) return sku.options;
  const source = sku.propertiesName || sku.text;
  return source
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const segments = part.split(":");
      if (segments.length < 4) return null;
      const [propertyId, valueId, name, ...valueParts] = segments;
      return {
        propertyId,
        valueId,
        name,
        value: valueParts.join(":")
      };
    })
    .filter(Boolean) as Array<{ propertyId: string; valueId: string; name: string; value: string; image?: string }>;
}

export function parseSkuOptionsFromText(text?: string) {
  if (!text) return [];
  return text
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const segments = part.split(":");
      if (segments.length < 4) return null;
      const [propertyId, valueId, name, ...valueParts] = segments;
      return {
        propertyId,
        valueId,
        name,
        value: valueParts.join(":")
      };
    })
    .filter(Boolean) as Array<{ propertyId: string; valueId: string; name: string; value: string }>;
}

export function normalizeSkuPropertyName(name: string) {
  const lowered = name.toLowerCase();
  if (lowered.includes("color")) return "Color";
  if (lowered.includes("size")) return "Size";
  return name
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeSkuImageUrl(url?: string) {
  if (!url) return undefined;
  const normalized = url.startsWith("//") ? `https:${url}` : url.replace(/^http:\/\//, "https://");
  return normalized.includes("_30x30") ? normalized : `${normalized}_30x30q90.jpg`;
}

function buildPropertyImageMap(raw: unknown) {
  const item = (raw as RawProduct | null)?.item;
  const map = new Map<string, string>();

  item?.prop_imgs?.prop_img?.forEach((image) => {
    if (image.properties && image.url) map.set(image.properties, normalizeSkuImageUrl(image.url) ?? image.url);
  });
  item?.props_imgs?.prop_img?.forEach((image) => {
    if (image.properties && image.url) map.set(image.properties, normalizeSkuImageUrl(image.url) ?? image.url);
  });
  Object.entries(item?.props_img ?? {}).forEach(([key, url]) => {
    map.set(key, normalizeSkuImageUrl(url) ?? url);
  });

  return map;
}

function groupSortWeight(name: string) {
  if (name === "Color") return 0;
  if (name === "Size") return 1;
  return 2;
}
