export const forwardingComparisonRows = ["owner", "payment", "workflow", "warehouse", "shipping"] as const;

export const forwardingStepKeys = [
  "register",
  "address",
  "buy",
  "userCode",
  "tracking",
  "receive",
  "chooseShipping",
  "payShipping",
  "ship"
] as const;

export const handlingServiceKeys = [
  "receiving",
  "storage",
  "consolidation",
  "photoInspection",
  "removePackaging",
  "repackaging",
  "internationalShipping",
  "trackingUpdate"
] as const;

export const restrictionKeys = [
  "restricted",
  "sensitive",
  "userCode",
  "trackingNumber",
  "storage",
  "finalFee",
  "customsTax"
] as const;

export const forwardingFaqKeys = [
  "whatIsForwarding",
  "difference",
  "warehouseAddress",
  "userCode",
  "consolidation",
  "forgotTracking",
  "restrictedItems",
  "feeCalculated"
] as const;

export const courierCompanyOptions = [
  "SF Express",
  "YTO Express",
  "ZTO Express",
  "STO Express",
  "Yunda Express",
  "JD Logistics",
  "China Post",
  "Other"
] as const;

export const productCategoryOptions = [
  "general",
  "clothing",
  "shoes",
  "electronics",
  "battery",
  "liquid",
  "cosmetics",
  "food",
  "luxury",
  "other"
] as const;

export const mockWarehouseAddress = {
  recipientName: "Jack Dai - UID10086",
  warehouseAddress: "3F, Building B, No. 168 Logistics Road, Baiyun District, Guangzhou, Guangdong, China",
  phoneNumber: "+86 138 0000 10086",
  postalCode: "510000",
  userCode: "UID10086"
};
