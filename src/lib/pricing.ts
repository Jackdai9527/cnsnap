export type PricingSettings = {
  exchangeRate: number;
  serviceFeeRate: number;
  minServiceFeeUsd: number;
  serviceFeeEnabled: boolean;
};

export function cnyToUsd(cny: number, exchangeRate: number) {
  return roundMoney(cny / exchangeRate);
}

export function calculateServiceFee(subtotalUsd: number, settings: PricingSettings) {
  if (!settings.serviceFeeEnabled || subtotalUsd <= 0) {
    return 0;
  }

  return roundMoney(Math.max(subtotalUsd * settings.serviceFeeRate, settings.minServiceFeeUsd));
}

export function calculateDisplayedProductPrice(priceCny: number, settings: PricingSettings) {
  const baseUsd = cnyToUsd(priceCny, settings.exchangeRate);
  const serviceFeeUsd = calculateServiceFee(baseUsd, settings);

  return {
    priceCny: roundMoney(priceCny),
    baseUsd,
    serviceFeeUsd,
    totalUsd: roundMoney(baseUsd + serviceFeeUsd)
  };
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function normalizeRate(value: number) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value > 1 ? value / 100 : value;
}

export function money(value: number | string, currency = "USD") {
  const numeric = Number(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(Number.isFinite(numeric) ? numeric : 0);
}
