export type ProductSku = {
  id: string;
  text: string;
  stock: number;
  priceCny?: number;
  properties?: string;
  propertiesName?: string;
  options?: Array<{
    propertyId: string;
    valueId: string;
    name: string;
    value: string;
    image?: string;
  }>;
};

export type NormalizedProduct = {
  platform: string;
  sourceItemId: string;
  sourceUrl: string;
  title: string;
  priceCny: number;
  priceUsd: number;
  images: string[];
  mainImage: string;
  shopName?: string;
  shopUrl?: string;
  domesticShippingCny?: number;
  skus: ProductSku[];
  attributes: Record<string, string>;
  descriptionHtml?: string;
  raw: unknown;
};

export type OneBoundItemGetResponse = {
  item?: {
    num_iid?: string | number;
    title?: string;
    price?: string | number;
    orginal_price?: string | number;
    nick?: string;
    num?: string | number;
    pic_url?: string;
    detail_url?: string;
    desc?: string;
    item_imgs?: Array<{ url?: string }>;
    skus?: { sku?: Array<{ sku_id?: string | number; properties?: string; properties_name?: string; quantity?: number | string; price?: number | string }> };
    props_name?: string;
    property_alias?: string;
    props_list?: Record<string, string>;
    prop_imgs?: { prop_img?: Array<{ properties?: string; url?: string }> };
    props_imgs?: { prop_img?: Array<{ properties?: string; url?: string }> };
    props_img?: Record<string, string>;
    props?: Array<{ name?: string; value?: string }>;
    item_weight?: number | string;
  };
  error?: string;
  error_code?: string;
  reason?: string;
  request_id?: string;
};

export type OneBoundSearchResponse = {
  items?: {
    item?: OneBoundSearchItem[];
    item_weight_update?: number;
    error?: string;
  };
  error?: string;
  error_code?: string;
  reason?: string;
  request_id?: string;
};

export type OneBoundSearchItem = {
  num_iid?: string | number;
  title?: string;
  price?: string | number;
  pic_url?: string;
  detail_url?: string;
  nick?: string;
  sales?: string | number;
};

export type WeidianSkuResponse = {
  status?: {
    code?: number;
    message?: string;
    description?: string;
  };
  result?: {
    attrList?: Array<{
      attrTitle?: string;
      attrValues?: Array<{
        attrId?: string | number;
        attrValue?: string;
        img?: string;
      }>;
    }>;
    itemId?: string | number;
    itemMainPic?: string;
    itemTitle?: string;
    itemDiscountLowPrice?: number;
    itemDiscountHighPrice?: number;
    itemOriginalLowPrice?: number;
    itemOriginalHighPrice?: number;
    itemStock?: number;
    skuInfos?: Array<{
      attrIds?: Array<string | number>;
      skuInfo?: {
        id?: string | number;
        discountPrice?: number;
        originalPrice?: number;
        stock?: number;
        title?: string;
        img?: string;
      };
    }>;
  };
};

export type WeidianDeliveryResponse = {
  status?: {
    code?: number;
    message?: string;
    description?: string;
  };
  result?: {
    default_model?: {
      delivery_info?: {
        expressFeeDesc?: string;
        expressPostageDesc?: string;
        deliveryServices?: Array<{
          feeDesc?: string;
          postageDesc?: string;
          priceDesc?: string;
        }>;
      };
    };
  };
};

export type WeidianShopItem = {
  itemId?: string | number;
  itemName?: string;
  itemImg?: string;
  itemUrl?: string;
  itemMainPic?: string;
  itemLowPrice?: number;
  itemPrice?: number;
  itemOriginalPrice?: number;
  price?: string | number;
  originalPrice?: string | number | null;
  status?: number;
  stock?: number;
  itemStock?: number;
  itemSoldout?: number;
  time?: number;
};

export type WeidianShopItemsResponse = {
  status?: {
    code?: number;
    message?: string;
    description?: string;
  };
  result?: {
    itemList?: WeidianShopItem[];
    hasData?: boolean;
    shopItems?: {
      items?: WeidianShopItem[];
    };
    tabs?: Array<{
      tabId?: number;
      tabName?: string;
    }>;
  };
};
