import type { ProductDetail } from "@/types/product-detail";

export function useProductDetail() {
  return {
    product: mockProductDetail,
    loading: false,
    error: null as string | null
  };
}

export const mockProductDetail: ProductDetail = {
  id: "mock-tmall-853832092739",
  sourcePlatform: "tmall",
  sourceUrl: "https://detail.tmall.com/item.htm?id=853832092739",
  sourceItemId: "853832092739",
  title: "Handmade Willow Nail Chain Accessory Set - Black Basic Edition",
  images: [
    {
      src: "https://picsum.photos/seed/cnsnap-pdp-main/900/900",
      highResSrc: "https://picsum.photos/seed/cnsnap-pdp-main/1800/1800",
      alt: "Black willow nail chain accessory front view",
      width: 900,
      height: 900
    },
    {
      src: "https://picsum.photos/seed/cnsnap-pdp-detail/900/900",
      highResSrc: "https://picsum.photos/seed/cnsnap-pdp-detail/1800/1800",
      alt: "Black willow nail chain accessory material detail",
      width: 900,
      height: 900
    },
    {
      src: "https://picsum.photos/seed/cnsnap-pdp-package/900/900",
      highResSrc: "https://picsum.photos/seed/cnsnap-pdp-package/1800/1800",
      alt: "Black willow nail chain accessory package view",
      width: 900,
      height: 900
    },
    {
      src: "https://picsum.photos/seed/cnsnap-pdp-scale/900/900",
      highResSrc: "https://picsum.photos/seed/cnsnap-pdp-scale/1800/1800",
      alt: "Black willow nail chain accessory scale reference",
      width: 900,
      height: 900
    }
  ],
  priceCny: 268,
  priceUsd: 37.22,
  domesticShippingCny: 8,
  shopName: "Shenzhen Handmade Studio",
  shopUrl: "https://shop.tmall.com",
  category: "Fashion Accessories",
  riskFlags: ["restricted", "manual_review"],
  variants: [
    {
      id: "color",
      name: "Color classification",
      options: [
        {
          id: "black-willow-chain",
          label: "Black Willow Nail Chain",
          image: "https://picsum.photos/seed/cnsnap-pdp-main/300/300"
        },
        {
          id: "black-basic",
          label: "Black Basic Edition",
          image: "https://picsum.photos/seed/cnsnap-pdp-detail/300/300"
        }
      ]
    },
    {
      id: "package",
      name: "Package",
      options: [
        { id: "single", label: "Single set" },
        { id: "gift-box", label: "Gift box" }
      ]
    }
  ],
  skus: [
    {
      id: "sku-black-willow-single",
      optionIds: { color: "black-willow-chain", package: "single" },
      text: "Color classification: Black Willow Nail Chain; Package: Single set",
      priceCny: 268,
      priceUsd: 37.22,
      stock: 28,
      image: "https://picsum.photos/seed/cnsnap-pdp-main/900/900"
    },
    {
      id: "sku-black-willow-gift",
      optionIds: { color: "black-willow-chain", package: "gift-box" },
      text: "Color classification: Black Willow Nail Chain; Package: Gift box",
      priceCny: 298,
      priceUsd: 41.39,
      stock: 12,
      image: "https://picsum.photos/seed/cnsnap-pdp-package/900/900"
    },
    {
      id: "sku-black-basic-single",
      optionIds: { color: "black-basic", package: "single" },
      text: "Color classification: Black Basic Edition; Package: Single set",
      priceCny: 238,
      priceUsd: 33.06,
      stock: 36,
      image: "https://picsum.photos/seed/cnsnap-pdp-detail/900/900"
    },
    {
      id: "sku-black-basic-gift",
      optionIds: { color: "black-basic", package: "gift-box" },
      text: "Color classification: Black Basic Edition; Package: Gift box",
      priceCny: 268,
      priceUsd: 37.22,
      stock: 0,
      image: "https://picsum.photos/seed/cnsnap-pdp-scale/900/900"
    }
  ],
  specs: [
    { name: "Origin", value: "Guangdong, China" },
    { name: "Material", value: "Alloy, resin, woven chain" },
    { name: "Weight", value: "0.32 kg estimated" },
    { name: "Package size", value: "22 x 14 x 6 cm" },
    { name: "Use case", value: "Fashion styling, handmade accessory, collectible display" }
  ],
  descriptionHtml:
    "<p>This handmade accessory is sourced from a China marketplace seller and purchased through CNSnap agent service.</p><p>Color and package options may require seller confirmation before purchase. Photos are reference images; final availability depends on the original seller inventory.</p>",
  relatedProducts: [
    {
      id: "rel-1",
      title: "Minimal chain accessory set",
      image: "https://picsum.photos/seed/cnsnap-related-1/600/600",
      priceCny: 198,
      priceUsd: 27.5,
      href: "/product/pdp-demo",
      sourcePlatform: "taobao"
    },
    {
      id: "rel-2",
      title: "Gift box fashion accessory",
      image: "https://picsum.photos/seed/cnsnap-related-2/600/600",
      priceCny: 328,
      priceUsd: 45.56,
      href: "/product/pdp-demo",
      sourcePlatform: "tmall"
    },
    {
      id: "rel-3",
      title: "Handmade black styling kit",
      image: "https://picsum.photos/seed/cnsnap-related-3/600/600",
      priceCny: 168,
      priceUsd: 23.33,
      href: "/product/pdp-demo",
      sourcePlatform: "1688"
    },
    {
      id: "rel-4",
      title: "Premium accessory display box",
      image: "https://picsum.photos/seed/cnsnap-related-4/600/600",
      priceCny: 88,
      priceUsd: 12.22,
      href: "/product/pdp-demo",
      sourcePlatform: "taobao"
    }
  ]
};
