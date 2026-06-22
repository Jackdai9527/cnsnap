import { calculateCheckoutPricing } from "@/lib/checkout-pricing";

const pricing = calculateCheckoutPricing({
  items: [
    { priceUsd: 10, priceCny: 72, quantity: 2, chinaFreightCny: 8 },
    { priceUsd: 20, priceCny: 144, quantity: 1, chinaFreightCny: 12 }
  ],
  upsells: [{ priceUsd: 1.5, quantity: 2 }],
  pricingSettings: {
    exchangeRate: 7.2,
    serviceFeeRate: 0.05,
    minServiceFeeUsd: 2,
    serviceFeeEnabled: true
  }
});

if (pricing.subtotalUsd !== 40) {
  throw new Error(`Expected subtotalUsd=40, received ${pricing.subtotalUsd}`);
}
if (pricing.domesticShippingCny !== 20) {
  throw new Error(`Expected domesticShippingCny=20, received ${pricing.domesticShippingCny}`);
}
if (pricing.domesticShippingUsd !== 2.78) {
  throw new Error(`Expected domesticShippingUsd=2.78, received ${pricing.domesticShippingUsd}`);
}
if (pricing.serviceFeeUsd !== 2) {
  throw new Error(`Expected serviceFeeUsd=2, received ${pricing.serviceFeeUsd}`);
}
if (pricing.upsellUsd !== 3) {
  throw new Error(`Expected upsellUsd=3, received ${pricing.upsellUsd}`);
}
if (pricing.totalUsd !== 47.78) {
  throw new Error(`Expected totalUsd=47.78, received ${pricing.totalUsd}`);
}

console.log("Checkout pricing assertions passed");
