import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { cnyToUsd, getPricingSettings } from "@/lib/currency";
import { parseSkuOptionsFromText } from "@/lib/sku-options";
import { logApiRequest, logError } from "@/lib/logger";
import type { NormalizedProduct, OneBoundItemGetResponse, OneBoundSearchItem, OneBoundSearchResponse, WeidianDeliveryResponse, WeidianShopItem, WeidianShopItemsResponse, WeidianSkuResponse } from "./types";

function normalizeProduct(product: Awaited<ReturnType<typeof prisma.productCache.findFirstOrThrow>>): NormalizedProduct {
  const attributes = product.attributes as Record<string, string>;
  const domesticShippingCny = extractDomesticShippingCny(product.rawJson) || Number(attributes.domesticShippingCny ?? 0);
  const weidianShopId = product.platform === "weidian" ? attributes.shopId || extractWeidianShopId(product.mainImage) : undefined;
  const shopUrl = product.shopUrl || (weidianShopId ? buildWeidianStoreUrl(weidianShopId) : undefined);

  return {
    platform: product.platform,
    sourceItemId: product.sourceItemId,
    sourceUrl: product.sourceUrl,
    title: product.title,
    priceCny: Number(product.priceCny),
    priceUsd: Number(product.priceUsd),
    images: product.images as string[],
    mainImage: product.mainImage,
    shopName: product.shopName ?? undefined,
    shopUrl,
    domesticShippingCny,
    skus: product.skus as NormalizedProduct["skus"],
    attributes,
    descriptionHtml: product.descriptionHtml ?? undefined,
    raw: product.rawJson
  };
}

export class OneBoundClient {
  private gateway = "https://api-gw.fan-b.com";

  async searchByKeyword(platform: string, keyword: string, page = 1, options: SearchOptions = {}) {
    const detectedPlatform = platform === "all" ? "taobao" : platform;
    if (keyword && detectedPlatform === "taobao") {
      const liveProducts = await this.fetchKeywordSearch(detectedPlatform, keyword, page, options);
      if (liveProducts.length) {
        return liveProducts;
      }
    }

    const take = 12;
    const skip = (page - 1) * take;
    const products = await prisma.productCache.findMany({
      where: {
        platform: platform === "all" ? undefined : platform,
        priceCny: {
          gte: options.startPrice || undefined,
          lte: options.endPrice || undefined
        },
        OR: keyword
          ? [
              { title: { contains: keyword } },
              { shopName: { contains: keyword } },
              { sourceItemId: { contains: keyword } }
            ]
          : undefined
      },
      skip,
      take,
      orderBy: getLocalOrderBy(options.sort)
    });

    await this.logApi("searchByKeyword", keyword ? "cache_fallback" : "mock_success", 42, { platform, keyword, page, ...options });

    return products.map(normalizeProduct);
  }

  async searchByUrl(url: string) {
    const platform = this.detectPlatform(url);
    return this.getItemDetail(platform, url, { refresh: true });
  }

  async searchByImage() {
    return this.searchByKeyword("all", "", 1);
  }

  async searchShop(platform: string, shopUrlOrKeyword: string) {
    return this.searchByKeyword(platform, shopUrlOrKeyword, 1);
  }

  async getWeidianShopItems(shopUrlOrId: string, page = 1, limit = 40) {
    const shopId = extractWeidianShopIdFromInput(shopUrlOrId);
    if (!shopId) {
      throw new Error("Missing Weidian shop id.");
    }

    const start = Date.now();
    const endpoint = "decorate/search.itemList/1.0";
    const url = new URL(`https://thor.weidian.com/${endpoint}`);
    const offset = (Math.max(1, page) - 1) * limit;
    url.searchParams.set("param", JSON.stringify({ shopId, key: "", offset, limit, sortId: 3, sortOrder: "desc", from: "h5" }));

    try {
      const response = await fetchWeidian(url);
      const json = (await response.json()) as WeidianShopItemsResponse;
      const latencyMs = Date.now() - start;
      if (!response.ok || json.status?.code !== 0) {
        await this.logApi("weidian_shop_items", `live_error_${json.status?.code ?? response.status}`, latencyMs, {
          platform: "weidian",
          shopId,
          page,
          offset,
          reason: json.status?.description ?? json.status?.message
        });
        throw new Error(json.status?.description || json.status?.message || "Unable to fetch Weidian shop products.");
      }

      const items = json.result?.itemList ?? json.result?.shopItems?.items ?? [];
      await this.logApi("weidian_shop_items", "live_success", latencyMs, {
        platform: "weidian",
        shopId,
        page,
        offset,
        count: items.length
      });

      return {
        shopId,
        shopUrl: buildWeidianStoreUrl(shopId),
        page,
        limit,
        hasNextPage: items.length >= limit,
        products: items.map((item) => {
          const sourceItemId = String(item.itemId ?? "");
          const priceCny = normalizeWeidianShopItemPrice(item);
          const mainImage = normalizeImageUrl(item.itemImg ?? item.itemMainPic) ?? "";
          return {
            platform: "weidian",
            sourceItemId,
            sourceUrl: normalizeWeidianSourceUrl(item.itemUrl ?? sourceItemId, sourceItemId),
            title: item.itemName ?? "Weidian item",
            priceCny,
            priceUsd: 0,
            images: mainImage ? [mainImage] : [],
            mainImage,
            shopName: "Weidian shop",
            shopUrl: buildWeidianStoreUrl(shopId),
            skus: [],
            attributes: {
              shopId,
              stock: String(item.stock ?? item.itemStock ?? ""),
              soldout: String(item.itemSoldout ?? item.status === 0 ? "1" : "0")
            },
            raw: item
          } satisfies NormalizedProduct;
        })
      };
    } catch (error) {
      if (error instanceof Error && error.message !== "Unable to fetch Weidian shop products.") {
        const latencyMs = Date.now() - start;
        logError(error, { event: "weidian_shop_items_exception", endpoint, platform: "weidian", shopId, page, durationMs: latencyMs });
        await this.logApi("weidian_shop_items", "live_exception", latencyMs, {
          platform: "weidian",
          shopId,
          page,
          error: error.message
        });
      }
      throw error;
    }
  }

  async getItemDetail(platform: string, itemIdOrUrl: string, options: { refresh?: boolean } = {}) {
    const itemId = this.extractItemId(itemIdOrUrl) || itemIdOrUrl;
    const product = await prisma.productCache.findFirst({
      where: {
        OR: [
          { platform, sourceItemId: itemId },
          { sourceUrl: { contains: itemIdOrUrl } },
          { title: { contains: itemIdOrUrl } }
        ]
      }
    });

    if (platform === "weidian") {
      if (!options.refresh && product && product.cacheExpiredAt > new Date() && !isMockProduct(product.rawJson) && hasDomesticShippingSnapshot(product)) {
        await this.logApi("weidian_item_get", "cache_hit", 0, { platform, itemIdOrUrl });
        return normalizeProduct(product);
      }

      const liveProduct = await this.fetchWeidianItemDetail(itemId, itemIdOrUrl);
      if (liveProduct) {
        return liveProduct;
      }

      if (product && !isMockProduct(product.rawJson)) {
        await this.logApi("weidian_item_get", "stale_cache_fallback", 0, { platform, itemIdOrUrl });
        return normalizeProduct(product);
      }

      await this.logApi("weidian_item_get", "no_live_or_valid_cache", 0, { platform, itemIdOrUrl });
      throw new Error(`Unable to fetch product detail from Weidian and no valid cache exists for weidian:${itemId}`);
    }

    if (!options.refresh && product && product.cacheExpiredAt > new Date() && !isMockProduct(product.rawJson)) {
      await this.logApi("item_get", "cache_hit", 0, { platform, itemIdOrUrl });
      return normalizeProduct(product);
    }

    const liveProduct = await this.fetchItemDetail(platform, itemId, itemIdOrUrl);
    if (liveProduct) {
      return liveProduct;
    }

    if (!product || isMockProduct(product.rawJson)) {
      await this.logApi("getItemDetail", "no_live_or_valid_cache", 0, { platform, itemIdOrUrl });
      throw new Error(`Unable to fetch product detail from OneBound and no valid cache exists for ${platform}:${itemId}`);
    }

    await this.logApi("getItemDetail", "stale_cache_fallback", 55, { platform, itemIdOrUrl });

    return normalizeProduct(product);
  }

  private async fetchItemDetail(platform: string, itemId: string, originalInput: string) {
    const credentials = await this.getCredentials();
    if (!credentials.key || !credentials.secret) {
      await this.logApi("item_get", "missing_credentials", 0, { platform, itemId });
      return null;
    }

    const apiPlatforms = platform === "taobao" ? ["taobao"] : [platform, "taobao"];

    for (const apiPlatform of apiPlatforms) {
      const start = Date.now();
      const endpoint = `${apiPlatform}/item_get`;
      const url = new URL(`${this.gateway}/${endpoint}/`);
      url.searchParams.set("key", credentials.key);
      url.searchParams.set("num_iid", itemId);
      url.searchParams.set("is_promotion", "1");
      url.searchParams.set("cache", "no");
      url.searchParams.set("lang", "en");
      url.searchParams.set("secret", credentials.secret);

      try {
        const response = await fetchOneBound(url);
        const json = (await response.json()) as OneBoundItemGetResponse;
        if (!response.ok || !json.item || json.error) {
          const latencyMs = Date.now() - start;
          await this.logApi(endpoint, `live_error_${json.error_code ?? response.status}`, latencyMs, {
            platform,
            apiPlatform,
            itemId,
            reason: json.reason ?? json.error
          });
          continue;
        }

        const product = await this.upsertItemFromOneBound(platform, json, originalInput);
        const latencyMs = Date.now() - start;
        await this.logApi(endpoint, "live_success", latencyMs, {
          platform,
          apiPlatform,
          itemId,
          requestId: json.request_id
        });
        return normalizeProduct(product);
      } catch (error) {
        const latencyMs = Date.now() - start;
        logError(error, { event: "onebound_live_exception", endpoint, platform, apiPlatform, itemId, durationMs: latencyMs });
        await this.logApi(endpoint, "live_exception", latencyMs, {
          platform,
          apiPlatform,
          itemId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return null;
  }

  private async fetchWeidianItemDetail(itemId: string, originalInput: string) {
    const start = Date.now();
    const endpoint = "detail/getItemSkuInfo/1.0";
    const url = new URL(`https://thor.weidian.com/${endpoint}`);
    url.searchParams.set("param", JSON.stringify({ itemId }));

    try {
      const [response, deliveryJson] = await Promise.all([
        fetchWeidian(url),
        this.fetchWeidianDeliveryInfo(itemId)
      ]);
      const json = (await response.json()) as WeidianSkuResponse;
      if (!response.ok || json.status?.code !== 0 || !json.result?.itemId) {
        const latencyMs = Date.now() - start;
        await this.logApi("weidian_item_get", `live_error_${json.status?.code ?? response.status}`, latencyMs, {
          platform: "weidian",
          itemId,
          reason: json.status?.description ?? json.status?.message
        });
        return null;
      }

      const product = await this.upsertItemFromWeidian(json, originalInput, deliveryJson);
      const latencyMs = Date.now() - start;
      await this.logApi("weidian_item_get", "live_success", latencyMs, {
        platform: "weidian",
        itemId,
        domesticShippingCny: extractDomesticShippingCny(deliveryJson)
      });
      return normalizeProduct(product);
    } catch (error) {
      const latencyMs = Date.now() - start;
      logError(error, { event: "weidian_live_exception", endpoint: "weidian_item_get", platform: "weidian", itemId, durationMs: latencyMs });
      await this.logApi("weidian_item_get", "live_exception", latencyMs, {
        platform: "weidian",
        itemId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  private async fetchWeidianDeliveryInfo(itemId: string) {
    const endpoint = "detail/getItemDeliveryInfo/1.0";
    const url = new URL(`https://thor.weidian.com/${endpoint}`);
    url.searchParams.set("param", JSON.stringify({ itemId }));

    try {
      const response = await fetchWeidian(url);
      const json = (await response.json()) as WeidianDeliveryResponse;
      if (!response.ok || json.status?.code !== 0) {
        await this.logApi("weidian_delivery_get", `live_error_${json.status?.code ?? response.status}`, 0, {
          platform: "weidian",
          itemId,
          reason: json.status?.description ?? json.status?.message
        });
        return null;
      }
      return json;
    } catch (error) {
      logError(error, { event: "weidian_delivery_exception", endpoint, platform: "weidian", itemId });
      await this.logApi("weidian_delivery_get", "live_exception", 0, {
        platform: "weidian",
        itemId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  private async fetchKeywordSearch(platform: string, keyword: string, page: number, options: SearchOptions) {
    const credentials = await this.getCredentials();
    if (!credentials.key || !credentials.secret) {
      await this.logApi("item_search", "missing_credentials", 0, { platform, keyword, page });
      return [];
    }

    const start = Date.now();
    const endpoint = `${platform}/item_search`;
    const url = new URL(`${this.gateway}/${endpoint}/`);
    url.searchParams.set("key", credentials.key);
    url.searchParams.set("q", keyword);
    url.searchParams.set("start_price", options.startPrice ? String(options.startPrice) : "0");
    url.searchParams.set("end_price", options.endPrice ? String(options.endPrice) : "0");
    url.searchParams.set("page", String(page));
    url.searchParams.set("cat", "0");
    url.searchParams.set("discount_only", options.noReasonReturn ? "1" : "");
    url.searchParams.set("sort", mapOneBoundSort(options.sort));
    url.searchParams.set("page_size", "");
    url.searchParams.set("seller_info", options.tmallFlagship ? "1" : "");
    url.searchParams.set("nick", "");
    url.searchParams.set("ppath", "");
    url.searchParams.set("imgid", "");
    url.searchParams.set("filter", options.freeShipping ? "post_free" : "");
    url.searchParams.set("lang", "en");
    url.searchParams.set("secret", credentials.secret);

    try {
      const response = await fetchOneBound(url);
      const json = (await response.json()) as OneBoundSearchResponse;
      const items = json.items?.item ?? [];
      if (!response.ok || json.error || !items.length) {
        const latencyMs = Date.now() - start;
        await this.logApi(endpoint, `live_error_${json.error_code ?? response.status}`, latencyMs, {
          platform,
          keyword,
          page,
          ...options,
          reason: json.reason ?? json.error ?? json.items?.error
        });
        return [];
      }

      const products = await Promise.all(items.map((item) => this.upsertSearchItem(platform, item)));
      const latencyMs = Date.now() - start;
      await this.logApi(endpoint, "live_success", latencyMs, {
        platform,
        keyword,
        page,
        ...options,
        count: products.length,
        requestId: json.request_id
      });
      return products.map(normalizeProduct);
    } catch (error) {
      const latencyMs = Date.now() - start;
      logError(error, { event: "onebound_search_exception", endpoint, platform, keyword, page, durationMs: latencyMs });
      await this.logApi(endpoint, "live_exception", latencyMs, {
        platform,
        keyword,
        ...options,
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  private async upsertItemFromOneBound(platform: string, response: OneBoundItemGetResponse, originalInput: string) {
    const item = response.item!;
    const settings = await getPricingSettings();
    const sourceItemId = String(item.num_iid ?? this.extractItemId(originalInput));
    const priceCny = Number(item.price ?? 0);
    const images = (item.item_imgs ?? [])
      .map((image) => normalizeImageUrl(image.url))
      .filter(Boolean) as string[];
    const mainImage = normalizeImageUrl(item.pic_url) ?? images[0] ?? "";
    const skus = item.skus?.sku?.map((sku) => ({
      id: String(sku.sku_id ?? sku.properties_name ?? "default"),
      text: sku.properties_name ?? "Default",
      stock: Number(sku.quantity ?? 0),
      priceCny: Number(sku.price ?? item.price ?? 0),
      properties: sku.properties,
      propertiesName: sku.properties_name,
      options: parseSkuOptionsFromText(sku.properties_name)
    })) ?? [{ id: "default", text: "Default", stock: Number(item.num ?? 0) || 99, priceCny }];
    const attributes = Object.fromEntries((item.props ?? []).map((prop) => [prop.name ?? "property", prop.value ?? ""]));
    if (item.item_weight) attributes.weight = `${item.item_weight}kg`;

    return prisma.productCache.upsert({
      where: { platform_sourceItemId: { platform, sourceItemId } },
      update: {
        sourceUrl: item.detail_url ?? originalInput,
        title: item.title ?? `OneBound ${platform} item`,
        mainImage,
        images: images.length ? images : [mainImage],
        shopName: item.nick,
        priceCny,
        priceUsd: cnyToUsd(priceCny, settings.exchangeRate),
        skus,
        attributes,
        descriptionHtml: item.desc,
        rawJson: response,
        cacheExpiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      create: {
        platform,
        sourceItemId,
        sourceUrl: item.detail_url ?? originalInput,
        title: item.title ?? `OneBound ${platform} item`,
        mainImage,
        images: images.length ? images : [mainImage],
        shopName: item.nick,
        shopUrl: "",
        priceCny,
        priceUsd: cnyToUsd(priceCny, settings.exchangeRate),
        skus,
        attributes,
        descriptionHtml: item.desc,
        rawJson: response,
        cacheExpiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });
  }

  private async upsertSearchItem(platform: string, item: OneBoundSearchItem) {
    const settings = await getPricingSettings();
    const sourceItemId = String(item.num_iid ?? this.extractItemId(item.detail_url ?? item.title ?? ""));
    const priceCny = Number(item.price ?? 0);
    const mainImage = normalizeImageUrl(item.pic_url) ?? "";

    return prisma.productCache.upsert({
      where: { platform_sourceItemId: { platform, sourceItemId } },
      update: {
        title: item.title ?? `OneBound ${platform} item`,
        mainImage,
        images: [mainImage],
        shopName: item.nick,
        sourceUrl: item.detail_url ?? `https://item.${platform}.com/item.htm?id=${sourceItemId}`,
        priceCny,
        priceUsd: cnyToUsd(priceCny, settings.exchangeRate),
        rawJson: item,
        cacheExpiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      create: {
        platform,
        sourceItemId,
        sourceUrl: item.detail_url ?? `https://item.${platform}.com/item.htm?id=${sourceItemId}`,
        title: item.title ?? `OneBound ${platform} item`,
        mainImage,
        images: [mainImage],
        shopName: item.nick,
        shopUrl: "",
        priceCny,
        priceUsd: cnyToUsd(priceCny, settings.exchangeRate),
        skus: [{ id: "default", text: "Default", stock: 99 }],
        attributes: { category: "general", sales: String(item.sales ?? "") },
        descriptionHtml: "",
        rawJson: item,
        cacheExpiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });
  }

  private async upsertItemFromWeidian(response: WeidianSkuResponse, originalInput: string, deliveryResponse?: WeidianDeliveryResponse | null) {
    const item = response.result!;
    const settings = await getPricingSettings();
    const sourceItemId = String(item.itemId ?? this.extractItemId(originalInput));
    const priceCny = centsToCny(item.itemDiscountLowPrice ?? item.itemOriginalLowPrice ?? 0);
    const attrValueMap = buildWeidianAttrValueMap(item.attrList);
    const attrImages = Array.from(attrValueMap.values())
      .map((value) => normalizeImageUrl(value.image))
      .filter(Boolean) as string[];
    const mainImage = normalizeImageUrl(item.itemMainPic) ?? attrImages[0] ?? "";
    const images = Array.from(new Set([mainImage, ...attrImages].filter(Boolean)));
    const sourceUrl = normalizeWeidianSourceUrl(originalInput, sourceItemId);
    const weidianShopId = extractWeidianShopId(mainImage);
    const shopUrl = weidianShopId ? buildWeidianStoreUrl(weidianShopId) : "";
    const skus = item.skuInfos?.length
      ? item.skuInfos.map((sku) => {
          const options = (sku.attrIds ?? []).map((attrId) => {
            const value = attrValueMap.get(String(attrId));
            return {
              propertyId: value?.propertyId ?? "weidian",
              valueId: String(attrId),
              name: value?.name ?? "Specification",
              value: value?.value ?? String(attrId),
              image: value?.image
            };
          });
          const skuInfo = sku.skuInfo ?? {};
          const text = options.map((option) => option.value).join(";") || skuInfo.title || "Default";
          return {
            id: String(skuInfo.id ?? sku.attrIds?.join("_") ?? "default"),
            text,
            stock: Number(skuInfo.stock ?? 0),
            priceCny: centsToCny(skuInfo.discountPrice ?? skuInfo.originalPrice ?? item.itemDiscountLowPrice ?? 0),
            propertiesName: options.map((option) => `${option.propertyId}:${option.valueId}:${option.name}:${option.value}`).join(";"),
            options
          };
        })
      : [{ id: "default", text: "Default", stock: Number(item.itemStock ?? 0) || 99, priceCny }];
    const attributes = {
      platform: "Weidian",
      itemId: sourceItemId,
      shopId: weidianShopId ?? "",
      stock: String(item.itemStock ?? ""),
      priceRange: buildWeidianPriceRange(item.itemDiscountLowPrice, item.itemDiscountHighPrice),
      domesticShippingCny: String(extractDomesticShippingCny(deliveryResponse ?? response)),
      domesticShippingFetched: deliveryResponse ? "true" : "false"
    };
    const rawJson = deliveryResponse ? { ...response, delivery: deliveryResponse } : response;

    return prisma.productCache.upsert({
      where: { platform_sourceItemId: { platform: "weidian", sourceItemId } },
      update: {
        sourceUrl,
        title: item.itemTitle ?? "Weidian item",
        mainImage,
        images: images.length ? images : [mainImage],
        shopName: "Weidian shop",
        shopUrl,
        priceCny,
        priceUsd: cnyToUsd(priceCny, settings.exchangeRate),
        skus,
        attributes,
        descriptionHtml: buildWeidianDescriptionHtml(item, images),
        rawJson,
        cacheExpiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      create: {
        platform: "weidian",
        sourceItemId,
        sourceUrl,
        title: item.itemTitle ?? "Weidian item",
        mainImage,
        images: images.length ? images : [mainImage],
        shopName: "Weidian shop",
        shopUrl,
        priceCny,
        priceUsd: cnyToUsd(priceCny, settings.exchangeRate),
        skus,
        attributes,
        descriptionHtml: buildWeidianDescriptionHtml(item, images),
        rawJson,
        cacheExpiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });
  }

  private async getCredentials() {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ["onebound_api_key", "onebound_api_secret", "onebound_gateway"] } }
    });
    const map = new Map(settings.map((setting) => [setting.key, setting.value]));
    this.gateway = map.get("onebound_gateway") || this.gateway;
    return {
      key: process.env.ONEBOUND_API_KEY || map.get("onebound_api_key") || "",
      secret: process.env.ONEBOUND_API_SECRET || map.get("onebound_api_secret") || ""
    };
  }

  private async logApi(endpoint: string, status: string, latencyMs: number, requestMeta: Prisma.InputJsonObject) {
    const failed = ["error", "exception", "missing_credentials", "no_live"].some((token) => status.includes(token));
    const succeeded = ["success", "cache_hit", "fallback", "mock_success"].some((token) => status.includes(token));

    logApiRequest({
      method: "ONEBOUND",
      endpoint,
      platform: typeof requestMeta.platform === "string" ? requestMeta.platform : undefined,
      durationMs: latencyMs,
      status,
      success: failed ? false : succeeded,
      error: failed ? status : undefined,
      meta: requestMeta as Record<string, unknown>
    });
    await prisma.apiLog.create({
      data: {
        provider: "onebound",
        endpoint,
        status,
        latencyMs,
        requestMeta
      }
    });
  }

  detectPlatform(input: string) {
    const lowered = input.toLowerCase();
    if (lowered.includes("tmall")) return "tmall";
    if (lowered.includes("1688")) return "1688";
    if (lowered.includes("jd")) return "jd";
    if (lowered.includes("weidian")) return "weidian";
    if (lowered.includes("vip")) return "vip";
    if (lowered.includes("xianyu") || lowered.includes("goofish")) return "xianyu";
    return "taobao";
  }

  extractItemId(input: string) {
    try {
      const url = new URL(input);
      return url.searchParams.get("id") || url.searchParams.get("itemID") || url.pathname.split("/").filter(Boolean).pop();
    } catch {
      return input.match(/[A-Za-z0-9]{4,}/)?.[0] ?? input;
    }
  }
}

export const oneBoundClient = new OneBoundClient();

export type SearchOptions = {
  startPrice?: number;
  endPrice?: number;
  sort?: string;
  noReasonReturn?: boolean;
  freeShipping?: boolean;
  tmallFlagship?: boolean;
};

function normalizeImageUrl(url?: string) {
  if (!url) return undefined;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
}

function isMockProduct(rawJson: Prisma.JsonValue) {
  if (!rawJson || typeof rawJson !== "object" || Array.isArray(rawJson)) return false;
  return Boolean((rawJson as { mocked?: unknown }).mocked);
}

function hasDomesticShippingSnapshot(product: Awaited<ReturnType<typeof prisma.productCache.findFirst>>) {
  const attributes = (product?.attributes ?? {}) as Record<string, string>;
  if (attributes.domesticShippingFetched === "true") return true;
  if (Number(attributes.domesticShippingCny ?? 0) > 0) return true;
  if (!product?.rawJson || typeof product.rawJson !== "object" || Array.isArray(product.rawJson)) return false;
  return Boolean((product.rawJson as { delivery?: unknown }).delivery);
}

function getLocalOrderBy(sort?: string) {
  if (sort === "price_asc") return { priceCny: "asc" as const };
  if (sort === "price_desc") return { priceCny: "desc" as const };
  return { updatedAt: "desc" as const };
}

function mapOneBoundSort(sort?: string) {
  if (sort === "sales") return "sale-desc";
  if (sort === "price_asc") return "price-asc";
  if (sort === "price_desc") return "price-desc";
  return "";
}

function extractDomesticShippingCny(raw: unknown): number {
  const candidates: number[] = [];
  const preferredKeys = new Set([
    "domesticShippingCny",
    "domestic_shipping_cny",
    "shippingCny",
    "freightCny",
    "postFee",
    "post_fee",
    "expressFee",
    "express_fee",
    "expressPostage",
    "express_postage",
    "deliveryFee",
    "delivery_fee",
    "freight",
    "postage"
  ]);
  const textKeys = new Set([
    "expressFeeDesc",
    "expressPostageDesc",
    "feeDesc",
    "postageDesc",
    "priceDesc",
    "deliveryFeeDesc",
    "freightDesc"
  ]);

  function addNumeric(value: unknown, key?: string) {
    const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
    if (!Number.isFinite(numeric) || numeric < 0) return;
    const normalized = key && /cent|fen|_fen|Price|Amount|Cent/.test(key) && numeric >= 100
      ? centsToCny(numeric)
      : numeric;
    candidates.push(normalized);
  }

  function addFromText(value: unknown) {
    if (typeof value !== "string") return;
    const match = value.match(/(\d+(?:\.\d+)?)/);
    if (match) addNumeric(match[1]);
  }

  function walk(value: unknown, key?: string) {
    if (key && preferredKeys.has(key)) addNumeric(value, key);
    if (key && textKeys.has(key)) addFromText(value);
    if (typeof value === "string" && /快递|运费|邮费|配送|freight|shipping|postage|delivery/i.test(value)) addFromText(value);
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach((item) => walk(item));
      return;
    }
    Object.entries(value).forEach(([entryKey, entryValue]) => walk(entryValue, entryKey));
  }

  walk(raw);
  const positive = candidates.filter((value) => Number.isFinite(value) && value > 0);
  return positive.length ? Math.min(...positive) : 0;
}

function fetchOneBound(url: URL) {
  return fetch(url, {
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(6500)
  });
}

function fetchWeidian(url: URL) {
  return fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      Origin: "https://weidian.com",
      Referer: "https://weidian.com/"
    },
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(9000)
  });
}

function centsToCny(value?: number) {
  return Number(((Number(value ?? 0) || 0) / 100).toFixed(2));
}

function normalizeWeidianShopItemPrice(item: WeidianShopItem) {
  if (item.price !== undefined && item.price !== null) {
    return Number((Number(item.price) || 0).toFixed(2));
  }
  if (item.originalPrice !== undefined && item.originalPrice !== null) {
    return Number((Number(item.originalPrice) || 0).toFixed(2));
  }
  return centsToCny(item.itemLowPrice ?? item.itemPrice ?? item.itemOriginalPrice ?? 0);
}

function normalizeWeidianSourceUrl(originalInput: string, itemId: string) {
  if (/^https?:\/\//i.test(originalInput)) return originalInput;
  return `https://weidian.com/item.html?itemID=${itemId}`;
}

function extractWeidianShopId(value?: string) {
  if (!value) return undefined;
  return value.match(/(?:open|pcitem)(\d+)-/)?.[1];
}

function extractWeidianShopIdFromInput(input: string) {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    return url.searchParams.get("userid") || url.searchParams.get("shopId") || extractWeidianShopId(trimmed);
  } catch {
    return trimmed.match(/\d{5,}/)?.[0] ?? extractWeidianShopId(trimmed);
  }
}

function buildWeidianStoreUrl(shopId: string) {
  const params = new URLSearchParams({ url: `https://weidian.com/?userid=${shopId}` });
  return `/item/store?${params.toString()}`;
}

function buildWeidianPriceRange(low?: number, high?: number) {
  const lowPrice = centsToCny(low);
  const highPrice = centsToCny(high ?? low);
  if (!lowPrice && !highPrice) return "";
  if (lowPrice === highPrice) return `CN￥${lowPrice.toFixed(2)}`;
  return `CN￥${lowPrice.toFixed(2)} - CN￥${highPrice.toFixed(2)}`;
}

type WeidianAttrList = NonNullable<NonNullable<WeidianSkuResponse["result"]>["attrList"]>;

function buildWeidianAttrValueMap(attrList?: WeidianAttrList) {
  const map = new Map<string, { propertyId: string; name: string; value: string; image?: string }>();
  attrList?.forEach((attr, index) => {
    const propertyId = `wd-${index + 1}`;
    attr.attrValues?.forEach((value) => {
      if (!value.attrId) return;
      map.set(String(value.attrId), {
        propertyId,
        name: attr.attrTitle || "Specification",
        value: value.attrValue || String(value.attrId),
        image: normalizeImageUrl(value.img)
      });
    });
  });
  return map;
}

function buildWeidianDescriptionHtml(item: NonNullable<WeidianSkuResponse["result"]>, images: string[]) {
  const imageHtml = images
    .slice(0, 24)
    .map((image) => `<p><img src="${escapeHtml(image)}" alt="${escapeHtml(item.itemTitle ?? "Weidian product")}" referrerpolicy="no-referrer" /></p>`)
    .join("");
  const attrs = (item.attrList ?? [])
    .map((attr) => {
      const values = (attr.attrValues ?? []).map((value) => value.attrValue).filter(Boolean).slice(0, 80).join(", ");
      return values ? `<li><strong>${escapeHtml(attr.attrTitle ?? "Specification")}:</strong> ${escapeHtml(values)}</li>` : "";
    })
    .filter(Boolean)
    .join("");
  return `<section class="weidian-detail"><h3>${escapeHtml(item.itemTitle ?? "Weidian product")}</h3>${attrs ? `<ul>${attrs}</ul>` : ""}${imageHtml}</section>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
