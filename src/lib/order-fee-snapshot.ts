export type OrderFeeSnapshot = {
  itemsSubtotalUsd: number;
  itemsSubtotalCny?: number;
  domesticShippingUsd: number;
  serviceFeeUsd: number;
  valueAddedServicesUsd: number;
  paidUsd: number;
  unpaidUsd: number;
  orderTotalUsd: number;
};

export function buildOrderFeeSnapshot(input: {
  subtotalUsd: number;
  subtotalCny?: number;
  domesticShippingUsd?: number;
  serviceFeeUsd?: number;
  valueAddedServicesUsd?: number;
  paidUsd?: number;
  unpaidUsd?: number;
  totalUsd: number;
}) {
  return {
    itemsSubtotalUsd: Number(input.subtotalUsd) || 0,
    itemsSubtotalCny: typeof input.subtotalCny === "number" ? input.subtotalCny : undefined,
    domesticShippingUsd: Number(input.domesticShippingUsd) || 0,
    serviceFeeUsd: Number(input.serviceFeeUsd) || 0,
    valueAddedServicesUsd: Number(input.valueAddedServicesUsd) || 0,
    paidUsd: Number(input.paidUsd) || 0,
    unpaidUsd: Number(input.unpaidUsd) || 0,
    orderTotalUsd: Number(input.totalUsd) || 0
  } satisfies OrderFeeSnapshot;
}
