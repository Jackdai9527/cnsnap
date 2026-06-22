import { prisma } from "@/lib/db";
export {
  calculateDisplayedProductPrice,
  calculateServiceFee,
  cnyToUsd,
  money,
  normalizeRate,
  roundMoney,
  type PricingSettings
} from "@/lib/pricing";
import { normalizeRate, type PricingSettings } from "@/lib/pricing";

export async function getPricingSettings(): Promise<PricingSettings> {
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          "exchange_rate_cny_usd",
          "service_fee_rate",
          "min_service_fee_usd",
          "service_fee_enabled"
        ]
      }
    }
  });
  const map = new Map(settings.map((setting) => [setting.key, setting.value]));

  return {
    exchangeRate: Number(map.get("exchange_rate_cny_usd") ?? 7.2),
    serviceFeeRate: normalizeRate(Number(map.get("service_fee_rate") ?? 0.05)),
    minServiceFeeUsd: Number(map.get("min_service_fee_usd") ?? 2),
    serviceFeeEnabled: map.get("service_fee_enabled") !== "false"
  };
}
