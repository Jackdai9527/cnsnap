import { roundMoney } from "@/lib/pricing";

export type ProductPriceDisplay = {
  primaryCurrency: string;
  primaryAmount: number;
  secondaryCurrency: string | null;
  secondaryAmount: number | null;
};

export function resolveProductPriceDisplay(params: {
  selectedCurrency: string;
  priceCny: number;
  priceUsd?: number;
  rates: Record<string, number>;
}) {
  const { selectedCurrency, priceCny, priceUsd = 0, rates } = params;
  const normalizedCurrency = selectedCurrency.toUpperCase();
  const cnyAmount = roundMoney(priceCny);
  const usdAmount = roundMoney(priceUsd > 0 ? priceUsd : convertCnyAmount(priceCny, "USD", rates));

  if (normalizedCurrency === "CNY") {
    return {
      primaryCurrency: "CNY",
      primaryAmount: cnyAmount,
      secondaryCurrency: null,
      secondaryAmount: null
    } satisfies ProductPriceDisplay;
  }

  return {
    primaryCurrency: normalizedCurrency,
    primaryAmount: roundMoney(convertCnyAmount(priceCny, normalizedCurrency, rates)),
    secondaryCurrency: "CNY",
    secondaryAmount: cnyAmount
  } satisfies ProductPriceDisplay;
}

export function convertCnyAmount(amountCny: number, currency: string, rates: Record<string, number>) {
  const normalizedCurrency = currency.toUpperCase();
  if (normalizedCurrency === "CNY") return roundMoney(amountCny);
  return roundMoney(amountCny * (rates[normalizedCurrency] ?? rates.USD ?? 1));
}

export function formatProductMoney(amount: number, currency: string) {
  const normalizedCurrency = currency.toUpperCase();
  if (normalizedCurrency === "CNY") {
    return `¥${roundMoney(amount).toFixed(2)}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalizedCurrency,
    maximumFractionDigits: normalizedCurrency === "JPY" || normalizedCurrency === "KRW" ? 0 : 2
  }).format(roundMoney(amount));
}
