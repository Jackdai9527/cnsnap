import type { ProductGalleryImage } from "@/components/product/ProductImageGallery";

export type ProductVariantOption = {
  id: string;
  label: string;
  image?: string;
};

export type ProductVariantGroup = {
  id: string;
  name: string;
  options: ProductVariantOption[];
};

export type ProductSkuDetail = {
  id: string;
  optionIds: Record<string, string>;
  text: string;
  priceCny: number;
  priceUsd: number;
  stock: number;
  image?: string;
};

export type ProductSpec = {
  name: string;
  value: string;
};

export type RelatedProduct = {
  id: string;
  title: string;
  image: string;
  priceCny: number;
  priceUsd: number;
  href: string;
  sourcePlatform: string;
};

export type ProductDetail = {
  id: string;
  sourcePlatform: string;
  sourceUrl: string;
  sourceItemId: string;
  title: string;
  images: ProductGalleryImage[];
  priceCny: number;
  priceUsd: number;
  domesticShippingCny: number;
  shopName: string;
  shopUrl?: string;
  variants: ProductVariantGroup[];
  skus: ProductSkuDetail[];
  descriptionHtml: string;
  specs: ProductSpec[];
  category: string;
  riskFlags: string[];
  relatedProducts: RelatedProduct[];
};
