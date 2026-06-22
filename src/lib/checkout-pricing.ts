import { calculateServiceFee, roundMoney, type PricingSettings } from "@/lib/currency";
import type { CartUpsellSelection } from "@/lib/cart-store";

export type CheckoutPricedItem = {
  priceUsd: number;
  priceCny: number;
  quantity: number;
  chinaFreightCny?: number;
};

export type CheckoutPricingResult = {
  subtotalUsd: number;
  subtotalCny: number;
  domesticShippingCny: number;
  domesticShippingUsd: number;
  serviceFeeUsd: number;
  upsellUsd: number;
  totalUsd: number;
};

export function calculateCheckoutPricing(params: {
  items: CheckoutPricedItem[];
  upsells?: Array<Pick<CartUpsellSelection, "priceUsd" | "quantity">>;
  pricingSettings: PricingSettings;
}) {
  const { items, upsells = [], pricingSettings } = params;
  const subtotalUsd = roundMoney(items.reduce((sum, item) => sum + Number(item.priceUsd) * item.quantity, 0));
  const subtotalCny = roundMoney(items.reduce((sum, item) => sum + Number(item.priceCny) * item.quantity, 0));
  const domesticShippingCny = roundMoney(items.reduce((sum, item) => sum + (Number(item.chinaFreightCny) || 0), 0));
  const domesticShippingUsd = roundMoney(domesticShippingCny / Math.max(pricingSettings.exchangeRate, 0.0001));
  const serviceFeeUsd = calculateServiceFee(subtotalUsd, pricingSettings);
  const upsellUsd = roundMoney(upsells.reduce((sum, service) => sum + Number(service.priceUsd) * service.quantity, 0));
  const totalUsd = roundMoney(subtotalUsd + domesticShippingUsd + serviceFeeUsd + upsellUsd);

  return {
    subtotalUsd,
    subtotalCny,
    domesticShippingCny,
    domesticShippingUsd,
    serviceFeeUsd,
    upsellUsd,
    totalUsd
  } satisfies CheckoutPricingResult;
}
