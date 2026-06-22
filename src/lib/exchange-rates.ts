import { prisma } from "@/lib/db";

export const baseCurrency = "CNY";
export const defaultEnabledCurrencies = [
  "USD",
  "AUD",
  "BRL",
  "CNY",
  "CAD",
  "DKK",
  "EUR",
  "GHS",
  "JPY",
  "MXN",
  "NZD",
  "NOK",
  "PLN",
  "RUB",
  "SEK",
  "CHF",
  "KRW",
  "GBP"
];

type ExchangeRateApiResponse = {
  result: string;
  time_last_update_unix?: number;
  time_next_update_unix?: number;
  base_code?: string;
  conversion_rates?: Record<string, number>;
  "error-type"?: string;
};

export function parseCurrencyList(value?: string | null) {
  const currencies = (value || defaultEnabledCurrencies.join(","))
    .split(/[,\s]+/)
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
  return Array.from(new Set([...currencies, "CNY"]));
}

export function formatBeijingTime(date?: Date | string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date(date));
}

export function buildManualFallbackRates({
  cnyPerUsd,
  usdToEur
}: {
  cnyPerUsd: number;
  usdToEur: number;
}) {
  const usdRate = Number.isFinite(cnyPerUsd) && cnyPerUsd > 0 ? 1 / cnyPerUsd : 1 / 7.2;
  const eurCrossRate = Number.isFinite(usdToEur) && usdToEur > 0 ? usdToEur : 0.92;
  const usdCrossRates: Record<string, number> = {
    USD: 1,
    AUD: 1.52,
    BRL: 5.4,
    CAD: 1.36,
    DKK: eurCrossRate * 7.46,
    EUR: eurCrossRate,
    GHS: 15.5,
    JPY: 157,
    MXN: 18.5,
    NZD: 1.65,
    NOK: 10.7,
    PLN: eurCrossRate * 4.3,
    RUB: 90,
    SEK: 10.4,
    CHF: 0.9,
    KRW: 1380,
    GBP: 0.78,
    CNY: cnyPerUsd
  };

  return Object.fromEntries(
    Object.entries(usdCrossRates).map(([currency, ratePerUsd]) => [
      currency,
      currency === "CNY" ? 1 : usdRate * ratePerUsd
    ])
  ) as Record<string, number>;
}

export async function getExchangeRateSettings() {
  const settings = await prisma.setting.findMany({
    where: { key: { in: ["exchange_rate_api_key", "enabled_frontend_currencies", "default_currency", "exchange_rate_cny_usd", "sepa_usd_eur_rate"] } }
  });
  const map = new Map(settings.map((setting) => [setting.key, setting.value]));
  const enabledCurrencies = parseCurrencyList(map.get("enabled_frontend_currencies"));
  const defaultCurrency = (map.get("default_currency") || "USD").toUpperCase();
  const cnyPerUsd = Number(map.get("exchange_rate_cny_usd") || 7.2);
  const usdToEur = Number(map.get("sepa_usd_eur_rate") || 0.92);

  return {
    apiKey: process.env.EXCHANGE_RATE_API_KEY || map.get("exchange_rate_api_key") || "",
    enabledCurrencies,
    defaultCurrency: enabledCurrencies.includes(defaultCurrency) ? defaultCurrency : enabledCurrencies[0] ?? "CNY",
    fallbackRates: buildManualFallbackRates({ cnyPerUsd, usdToEur })
  };
}

export async function getLatestExchangeRateSnapshot() {
  return prisma.exchangeRateSnapshot.findFirst({ orderBy: { updatedAt: "desc" } });
}

export async function ensureExchangeRatesFresh(force = false) {
  const latest = await getLatestExchangeRateSnapshot();
  const shouldSkip =
    !force &&
    latest?.fetchedAt &&
    Date.now() - latest.fetchedAt.getTime() < 60 * 60 * 1000;
  if (shouldSkip) return latest;
  return refreshExchangeRates();
}

export async function refreshExchangeRates() {
  const settings = await getExchangeRateSettings();
  if (!settings.apiKey) {
    return prisma.exchangeRateSnapshot.create({
      data: {
        baseCode: baseCurrency,
        enabledCurrencies: settings.enabledCurrencies,
        rates: { CNY: 1 },
        result: "error",
        status: "failed",
        error: "ExchangeRate-API key is missing.",
        fetchedAt: new Date()
      }
    });
  }

  try {
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${settings.apiKey}/latest/${baseCurrency}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(15000)
    });
    const json = (await response.json()) as ExchangeRateApiResponse;
    if (!response.ok || json.result !== "success" || !json.conversion_rates) {
      throw new Error(json["error-type"] || `ExchangeRate-API failed with ${response.status}`);
    }
    const rates = json.conversion_rates;

    return prisma.$transaction(async (tx) => {
      const usdRate = rates.USD;
      const eurRate = rates.EUR;
      if (usdRate && usdRate > 0) {
        await tx.setting.upsert({
          where: { key: "exchange_rate_cny_usd" },
          update: { value: String(1 / usdRate), label: "CNY/USD Exchange Rate" },
          create: { key: "exchange_rate_cny_usd", value: String(1 / usdRate), label: "CNY/USD Exchange Rate" }
        });
      }
      if (usdRate && eurRate && usdRate > 0) {
        await tx.setting.upsert({
          where: { key: "sepa_usd_eur_rate" },
          update: { value: String(eurRate / usdRate), label: "USD/EUR Exchange Rate" },
          create: { key: "sepa_usd_eur_rate", value: String(eurRate / usdRate), label: "USD/EUR Exchange Rate" }
        });
      }

      return tx.exchangeRateSnapshot.create({
        data: {
          baseCode: json.base_code || baseCurrency,
          enabledCurrencies: settings.enabledCurrencies,
          rates,
          result: json.result,
          status: "success",
          error: null,
          fetchedAt: new Date(),
          providerUpdatedAt: unixToDate(json.time_last_update_unix),
          providerNextAt: unixToDate(json.time_next_update_unix)
        }
      });
    });
  } catch (error) {
    return prisma.exchangeRateSnapshot.create({
      data: {
        baseCode: baseCurrency,
        enabledCurrencies: settings.enabledCurrencies,
        rates: {},
        result: "error",
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        fetchedAt: new Date()
      }
    });
  }
}

function unixToDate(value?: number) {
  return value ? new Date(value * 1000) : undefined;
}

declare global {
  var haitaoExchangeRateScheduler: NodeJS.Timeout | undefined;
}

export function startExchangeRateScheduler() {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (globalThis.haitaoExchangeRateScheduler) return;

  globalThis.haitaoExchangeRateScheduler = setInterval(() => {
    ensureExchangeRatesFresh().catch((error) => {
      console.error("[exchange-rates] scheduled refresh failed", error);
    });
  }, 60 * 60 * 1000);
  globalThis.haitaoExchangeRateScheduler.unref?.();
}
