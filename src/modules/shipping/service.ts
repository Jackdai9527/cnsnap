import { prisma } from "@/lib/db";
import { cnyToUsd, getPricingSettings, roundMoney } from "@/lib/currency";

export type ShippingEstimateInput = {
  country: string;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  category?: string;
};

export async function estimateShipping(input: ShippingEstimateInput) {
  const pricing = await getPricingSettings();
  const channels = await prisma.shippingChannel.findMany({
    where: { isActive: true },
    include: { rates: true },
    orderBy: [{ sortOrder: "asc" }, { firstWeightFeeUsd: "asc" }]
  });

  return channels
    .filter((channel) => {
      const countries = channel.supportedCountries as string[];
      const forbidden = channel.forbiddenCategories as string[];
      const hasRate = channel.rates.some((rate) => rate.countryCode === input.country);
      return (countries.includes(input.country) || hasRate) && !forbidden.includes(input.category ?? "general");
    })
    .flatMap((channel) => {
      const volumeWeight =
        input.lengthCm && input.widthCm && input.heightCm
          ? (input.lengthCm * input.widthCm * input.heightCm) / channel.volumeDivisor
          : 0;
      const rate = channel.rates.find((item) => item.countryCode === input.country);
      const startWeight = rate ? Number(rate.startWeightKg) : Number(channel.minWeightKg);
      const chargeableWeight = Math.max(input.weightKg, volumeWeight, startWeight);

      if (rate) {
        const maxWeight = Number(rate.maxWeightKg);
        if (chargeableWeight > maxWeight) return [];
        const feeCny = roundMoney(
          chargeableWeight * Number(rate.freightRmbPerKg) + Number(rate.handlingFeeRmb)
        );
        const feeUsd = cnyToUsd(feeCny, pricing.exchangeRate);

        return [{
          id: channel.id,
          code: channel.code,
          name: channel.name,
          feeUsd,
          feeCny,
          chargeableWeight: roundMoney(chargeableWeight),
          deliveryTime: `${channel.deliveryTimeMin}-${channel.deliveryTimeMax} days`,
          forbiddenCategories: channel.forbiddenCategories as string[],
          rate: {
            countryCode: rate.countryCode,
            countryName: rate.countryName,
            freightRmbPerKg: Number(rate.freightRmbPerKg),
            handlingFeeRmb: Number(rate.handlingFeeRmb),
            maxWeightKg: maxWeight
          }
        }];
      }

      const extraWeight = Math.max(0, chargeableWeight - Number(channel.firstWeightKg));
      const extraUnits = Math.ceil(extraWeight / Number(channel.additionalWeightKg));
      const fee = roundMoney(Number(channel.firstWeightFeeUsd) + extraUnits * Number(channel.additionalWeightFeeUsd));

      return [{
        id: channel.id,
        code: channel.code,
        name: channel.name,
        feeUsd: fee,
        chargeableWeight: roundMoney(chargeableWeight),
        deliveryTime: `${channel.deliveryTimeMin}-${channel.deliveryTimeMax} days`,
        forbiddenCategories: channel.forbiddenCategories as string[]
      }];
    });
}
