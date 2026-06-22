"use client";

import { getPricingSettings, roundMoney } from "@/lib/currency";
import { calculateCheckoutPricing } from "@/lib/checkout-pricing";

export const cartStorageKey = "haitao_cart";
export const cartUpsellStorageKey = "haitao_cart_upsells";
export const cartUpdatedEvent = "haitao-cart-updated";
export const cartToastEvent = "haitao-cart-toast";

export type CartProduct = {
  platform: string;
  sourceItemId: string;
  title: string;
  mainImage: string;
  priceCny: number;
  priceUsd: number;
};

export type CartItem = {
  productId: number;
  product: CartProduct;
  skuId?: string;
  skuText?: string;
  quantity: number;
  chinaFreight?: number;
  addedAt?: number;
};

export type CartUpsellSelection = {
  serviceId: number;
  code: string;
  name: string;
  chargeStandard: string;
  priceUsd: number;
  priceMode: string;
  quantity: number;
  note?: string;
  addedAt?: number;
};

export type CartSummary = {
  itemCount: number;
  quantity: number;
  subtotalUsd: number;
  domesticShippingUsd: number;
  serviceFee: number;
  upsellUsd: number;
  total: number;
};

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  return parseCartSnapshot(localStorage.getItem(cartStorageKey) ?? "[]");
}

export function readCartUpsells(): CartUpsellSelection[] {
  if (typeof window === "undefined") return [];
  return parseCartUpsellSnapshot(localStorage.getItem(cartUpsellStorageKey) ?? "[]");
}

export function parseCartSnapshot(snapshot: string): CartItem[] {
  try {
    const parsed = JSON.parse(snapshot);
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
  } catch {
    return [];
  }
}

export function parseCartUpsellSnapshot(snapshot: string): CartUpsellSelection[] {
  try {
    const parsed = JSON.parse(snapshot);
    return Array.isArray(parsed) ? parsed.filter(isCartUpsellSelection) : [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  localStorage.setItem(cartStorageKey, JSON.stringify(items));
  localStorage.setItem(cartUpsellStorageKey, "[]");
  window.dispatchEvent(new CustomEvent(cartUpdatedEvent));
}

export function writeCartUpsells(upsells: CartUpsellSelection[]) {
  localStorage.setItem(cartUpsellStorageKey, JSON.stringify(upsells));
  window.dispatchEvent(new CustomEvent(cartUpdatedEvent));
}

export function addCartItem(item: CartItem) {
  const cart = readCart();
  const index = cart.findIndex(
    (candidate) =>
      candidate.productId === item.productId &&
      (candidate.skuId ?? "") === (item.skuId ?? "") &&
      (candidate.skuText ?? "") === (item.skuText ?? "")
  );
  const nextCart =
    index >= 0
      ? cart.map((candidate, candidateIndex) =>
          candidateIndex === index
            ? {
                ...candidate,
                quantity: candidate.quantity + item.quantity,
                chinaFreight: item.chinaFreight ?? candidate.chinaFreight,
                addedAt: Date.now()
              }
            : candidate
        )
      : [...cart, { ...item, addedAt: Date.now() }];

  writeCart(nextCart);
  window.dispatchEvent(
    new CustomEvent(cartToastEvent, {
      detail: {
        title: "Added to cart",
        message: `${item.quantity} x ${item.product.title}`,
        summary: summarizeCart(nextCart)
      }
    })
  );
  return nextCart;
}

export function clearCart() {
  writeCart([]);
}

export function removeCartItem(index: number) {
  const cart = readCart();
  writeCart(cart.filter((_, itemIndex) => itemIndex !== index));
}

export function summarizeCart(items: CartItem[], upsells: CartUpsellSelection[] = []): CartSummary {
  const exchangeRate = 7.2;
  const serviceFeeRate = 0.05;
  const minServiceFeeUsd = 2;
  const pricing = calculateCheckoutPricing({
    items: items.map((item) => ({
      priceUsd: Number(item.product.priceUsd),
      priceCny: Number(item.product.priceCny),
      quantity: item.quantity,
      chinaFreightCny: Number(item.chinaFreight) || 0
    })),
    upsells,
    pricingSettings: {
      exchangeRate,
      serviceFeeRate,
      minServiceFeeUsd,
      serviceFeeEnabled: true
    }
  });
  return {
    itemCount: items.length,
    quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalUsd: pricing.subtotalUsd,
    domesticShippingUsd: pricing.domesticShippingUsd,
    serviceFee: pricing.serviceFeeUsd,
    upsellUsd: pricing.upsellUsd,
    total: pricing.totalUsd
  };
}

export function subscribeToCart(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(cartUpdatedEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(cartUpdatedEvent, onStoreChange);
  };
}

export function cartSnapshot() {
  if (typeof window === "undefined") return "[]";
  return localStorage.getItem(cartStorageKey) ?? "[]";
}

export function cartUpsellSnapshot() {
  if (typeof window === "undefined") return "[]";
  return localStorage.getItem(cartUpsellStorageKey) ?? "[]";
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const candidate = value as CartItem;
  return Boolean(candidate.productId && candidate.product && candidate.quantity > 0);
}

function isCartUpsellSelection(value: unknown): value is CartUpsellSelection {
  if (!value || typeof value !== "object") return false;
  const candidate = value as CartUpsellSelection;
  return Boolean(
    candidate.serviceId &&
    candidate.code &&
    candidate.name &&
    candidate.chargeStandard &&
    Number(candidate.priceUsd) >= 0 &&
    candidate.quantity > 0
  );
}
