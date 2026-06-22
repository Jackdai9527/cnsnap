export type ProductCategory =
  | "general"
  | "clothing"
  | "shoes"
  | "electronics"
  | "battery"
  | "liquid"
  | "cosmetics"
  | "food"
  | "powder"
  | "luxury"
  | "other";

export type ShippingChannelRule = {
  code: string;
  supportedCountries: string[];
  volumeDivisor: number;
  minChargeableWeightKg: number;
  firstWeightKg: number;
  firstWeightFeeUsd: number;
  additionalWeightKg: number;
  additionalWeightFeeUsd: number;
  restrictedCategories?: ProductCategory[];
  maxWeightKg?: number;
};

export type ShippingEstimateResultItem = {
  channel: ShippingChannelRule;
  actualWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  estimatedFeeUsd: number;
  unavailableReasonKey?: "unsupportedCountry" | "restrictedCategory" | "maxWeight";
  unavailableReasonValue?: string | number;
};

export type ShippingEstimateResult = {
  actualWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  available: ShippingEstimateResultItem[];
  unavailable: ShippingEstimateResultItem[];
  restrictionNoticeKey: "sensitive" | "general";
};

export const productCategories: Array<{ value: ProductCategory; labelKey: string }> = [
  { value: "general", labelKey: "categories.general" },
  { value: "clothing", labelKey: "categories.clothing" },
  { value: "shoes", labelKey: "categories.shoes" },
  { value: "electronics", labelKey: "categories.electronics" },
  { value: "battery", labelKey: "categories.battery" },
  { value: "liquid", labelKey: "categories.liquid" },
  { value: "cosmetics", labelKey: "categories.cosmetics" },
  { value: "food", labelKey: "categories.food" },
  { value: "powder", labelKey: "categories.powder" },
  { value: "luxury", labelKey: "categories.luxury" },
  { value: "other", labelKey: "categories.other" }
];

export const popularDestinationCountries = [
  "US",
  "CA",
  "GB",
  "DE",
  "FR",
  "NL",
  "PL",
  "JP",
  "KR",
  "AU",
  "BR",
  "MX"
];

export const shippingChannelRules: ShippingChannelRule[] = [
  {
    code: "dhl",
    supportedCountries: ["US", "CA", "GB", "DE", "FR", "NL", "PL", "JP", "KR", "AU", "MX"],
    volumeDivisor: 5000,
    minChargeableWeightKg: 0.5,
    firstWeightKg: 0.5,
    firstWeightFeeUsd: 24,
    additionalWeightKg: 0.5,
    additionalWeightFeeUsd: 7.8,
    restrictedCategories: ["battery", "liquid", "food", "powder"],
    maxWeightKg: 30
  },
  {
    code: "fedex",
    supportedCountries: ["US", "CA", "GB", "DE", "FR", "NL", "PL", "JP", "KR", "AU", "BR", "MX"],
    volumeDivisor: 5000,
    minChargeableWeightKg: 0.5,
    firstWeightKg: 0.5,
    firstWeightFeeUsd: 22,
    additionalWeightKg: 0.5,
    additionalWeightFeeUsd: 7.2,
    restrictedCategories: ["battery", "liquid", "food", "powder"],
    maxWeightKg: 35
  },
  {
    code: "ups",
    supportedCountries: ["US", "CA", "GB", "DE", "FR", "NL", "PL", "JP", "KR", "AU", "MX"],
    volumeDivisor: 5000,
    minChargeableWeightKg: 0.5,
    firstWeightKg: 0.5,
    firstWeightFeeUsd: 23,
    additionalWeightKg: 0.5,
    additionalWeightFeeUsd: 7.5,
    restrictedCategories: ["battery", "liquid", "food", "powder"],
    maxWeightKg: 35
  },
  {
    code: "ems",
    supportedCountries: ["US", "CA", "GB", "DE", "FR", "NL", "PL", "JP", "KR", "AU", "BR", "MX"],
    volumeDivisor: 6000,
    minChargeableWeightKg: 0.5,
    firstWeightKg: 0.5,
    firstWeightFeeUsd: 17,
    additionalWeightKg: 0.5,
    additionalWeightFeeUsd: 5.6,
    restrictedCategories: ["liquid", "food", "powder"],
    maxWeightKg: 20
  },
  {
    code: "air-cargo",
    supportedCountries: ["US", "CA", "GB", "DE", "FR", "NL", "PL", "JP", "KR", "AU", "BR", "MX"],
    volumeDivisor: 6000,
    minChargeableWeightKg: 1,
    firstWeightKg: 1,
    firstWeightFeeUsd: 19,
    additionalWeightKg: 1,
    additionalWeightFeeUsd: 8.8,
    restrictedCategories: ["liquid", "food"],
    maxWeightKg: 50
  },
  {
    code: "economy",
    supportedCountries: ["US", "CA", "GB", "DE", "FR", "NL", "PL", "JP", "KR", "AU", "BR", "MX"],
    volumeDivisor: 6000,
    minChargeableWeightKg: 0.5,
    firstWeightKg: 0.5,
    firstWeightFeeUsd: 12,
    additionalWeightKg: 0.5,
    additionalWeightFeeUsd: 4.2,
    restrictedCategories: ["battery", "liquid", "food", "powder", "luxury"],
    maxWeightKg: 25
  },
  {
    code: "sensitive",
    supportedCountries: ["US", "CA", "GB", "DE", "FR", "NL", "PL", "JP", "KR", "AU"],
    volumeDivisor: 6000,
    minChargeableWeightKg: 0.5,
    firstWeightKg: 0.5,
    firstWeightFeeUsd: 20,
    additionalWeightKg: 0.5,
    additionalWeightFeeUsd: 6.9,
    restrictedCategories: ["liquid", "food", "powder"],
    maxWeightKg: 20
  },
  {
    code: "sea",
    supportedCountries: ["US", "CA", "GB", "DE", "FR", "NL", "PL", "AU", "BR", "MX"],
    volumeDivisor: 8000,
    minChargeableWeightKg: 5,
    firstWeightKg: 5,
    firstWeightFeeUsd: 48,
    additionalWeightKg: 1,
    additionalWeightFeeUsd: 4.6,
    restrictedCategories: ["battery", "liquid", "food", "powder", "cosmetics"],
    maxWeightKg: 100
  }
];

export function getShippingChannelTranslationKey(code: ShippingChannelRule["code"]) {
  return `Estimation.channelDetails.${code}` as const;
}

export function calculateShippingEstimate({
  destinationCountry,
  productCategory,
  actualWeightKg,
  lengthCm,
  widthCm,
  heightCm,
  shippingChannel
}: {
  destinationCountry: string;
  productCategory: ProductCategory;
  actualWeightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  shippingChannel?: string;
}): ShippingEstimateResult {
  const selectedRules = shippingChannel
    ? shippingChannelRules.filter((rule) => rule.code === shippingChannel)
    : shippingChannelRules;
  const hasDimensions = Boolean(lengthCm && widthCm && heightCm);
  const referenceDivisor = selectedRules[0]?.volumeDivisor ?? 6000;
  const volumetricWeightKg = hasDimensions
    ? roundWeight((Number(lengthCm) * Number(widthCm) * Number(heightCm)) / referenceDivisor)
    : 0;

  const items = selectedRules.map((channel) => {
    const channelVolumetricWeightKg = hasDimensions
      ? roundWeight((Number(lengthCm) * Number(widthCm) * Number(heightCm)) / channel.volumeDivisor)
      : 0;
    const chargeableWeightKg = roundWeight(Math.max(actualWeightKg, channelVolumetricWeightKg, channel.minChargeableWeightKg));
    const unavailableReason = getUnavailableReason(channel, destinationCountry, productCategory, chargeableWeightKg);

    return {
      channel,
      actualWeightKg,
      volumetricWeightKg: channelVolumetricWeightKg,
      chargeableWeightKg,
      estimatedFeeUsd: unavailableReason ? 0 : calculateChannelFee(channel, chargeableWeightKg),
      unavailableReasonKey: unavailableReason?.key,
      unavailableReasonValue: unavailableReason?.value
    };
  });

  const available = items.filter((item) => !item.unavailableReasonKey).sort((a, b) => a.estimatedFeeUsd - b.estimatedFeeUsd);
  const unavailable = items.filter((item) => item.unavailableReasonKey);
  const representativeChargeableWeight = available[0]?.chargeableWeightKg ?? items[0]?.chargeableWeightKg ?? actualWeightKg;

  return {
    actualWeightKg,
    volumetricWeightKg,
    chargeableWeightKg: representativeChargeableWeight,
    available,
    unavailable,
    restrictionNoticeKey: getRestrictionNoticeKey(productCategory)
  };
}

function calculateChannelFee(channel: ShippingChannelRule, chargeableWeightKg: number) {
  if (chargeableWeightKg <= channel.firstWeightKg) {
    return roundMoney(channel.firstWeightFeeUsd);
  }

  const remainingWeight = chargeableWeightKg - channel.firstWeightKg;
  const additionalUnits = Math.ceil(remainingWeight / channel.additionalWeightKg);
  return roundMoney(channel.firstWeightFeeUsd + additionalUnits * channel.additionalWeightFeeUsd);
}

function getUnavailableReason(
  channel: ShippingChannelRule,
  destinationCountry: string,
  productCategory: ProductCategory,
  chargeableWeightKg: number
) {
  if (!channel.supportedCountries.includes(destinationCountry)) {
    return { key: "unsupportedCountry" as const, value: destinationCountry };
  }

  if (channel.restrictedCategories?.includes(productCategory)) {
    return { key: "restrictedCategory" as const, value: productCategory };
  }

  if (channel.maxWeightKg && chargeableWeightKg > channel.maxWeightKg) {
    return { key: "maxWeight" as const, value: channel.maxWeightKg };
  }

  return undefined;
}

function getRestrictionNoticeKey(productCategory: ProductCategory): "sensitive" | "general" {
  const sensitiveCategories: ProductCategory[] = ["battery", "liquid", "cosmetics", "food", "powder", "luxury"];

  if (sensitiveCategories.includes(productCategory)) {
    return "sensitive";
  }

  return "general";
}

function roundWeight(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.ceil(value * 100) / 100;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
