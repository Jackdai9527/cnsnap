"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { convertCnyAmount } from "@/lib/product-price-display";

const currencyStorageKey = "haitao_currency";
const currencyEventName = "haitao-currency-updated";

type CurrencyContextValue = {
  currencies: string[];
  defaultCurrency: string;
  rates: Record<string, number>;
};

const CurrencyContext = createContext<CurrencyContextValue>({
  currencies: ["USD", "CNY"],
  defaultCurrency: "USD",
  rates: { CNY: 1, USD: 0.14 }
});

export function CurrencyProvider({
  currencies,
  defaultCurrency,
  rates,
  children
}: CurrencyContextValue & { children: ReactNode }) {
  const value = useMemo(
    () => ({
      currencies: normalizeCurrencies(currencies),
      defaultCurrency,
      rates: { CNY: 1, ...rates }
    }),
    [currencies, defaultCurrency, rates]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  const storedCurrency = useSyncExternalStore(subscribeToCurrency, currencySnapshot, () => "");
  const selectedCurrency = storedCurrency && context.currencies.includes(storedCurrency)
    ? storedCurrency
    : context.defaultCurrency;

  function selectCurrency(currency: string) {
    if (!context.currencies.includes(currency)) return;
    localStorage.setItem(currencyStorageKey, currency);
    window.dispatchEvent(new CustomEvent(currencyEventName, { detail: { currency } }));
  }

  return {
    ...context,
    selectedCurrency,
    selectCurrency,
    formatCny: (amountCny: number) => formatCurrency(convertCny(amountCny, selectedCurrency, context.rates), selectedCurrency),
    formatUsd: (amountUsd: number) => formatCurrency(convertUsd(amountUsd, selectedCurrency, context.rates), selectedCurrency),
    formatCurrency,
    convertCny: (amountCny: number) => convertCny(amountCny, selectedCurrency, context.rates),
    convertUsd: (amountUsd: number) => convertUsd(amountUsd, selectedCurrency, context.rates)
  };
}

export function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" || currency === "KRW" ? 0 : 2
  }).format(Number.isFinite(value) ? value : 0);
}

function convertCny(amountCny: number, currency: string, rates: Record<string, number>) {
  return convertCnyAmount(amountCny, currency, rates);
}

function convertUsd(amountUsd: number, currency: string, rates: Record<string, number>) {
  const usdRate = rates.USD || 1;
  const cnyAmount = amountUsd / usdRate;
  return convertCny(cnyAmount, currency, rates);
}

function subscribeToCurrency(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(currencyEventName, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(currencyEventName, onStoreChange);
  };
}

function currencySnapshot() {
  return localStorage.getItem(currencyStorageKey) ?? "";
}

function normalizeCurrencies(currencies: string[]) {
  return Array.from(new Set([...currencies.map((currency) => currency.toUpperCase()), "CNY"]));
}
