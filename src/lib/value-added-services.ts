import type { Prisma, ValueAddedService } from "@prisma/client";

export type ValueAddedServiceSeed = {
  code: string;
  name: string;
  description: string;
  applicableRange: string;
  chargeStandard: string;
  priceUsd: number;
  priceMode: string;
  serviceTime: string;
  buyerNotice: string;
  serviceGuarantee: string;
  specialNote: string;
  sortOrder: number;
  isActive: boolean;
};

export type CartValueAddedService = {
  id: number;
  code: string;
  name: string;
  description: string;
  applicableRange: string | null;
  chargeStandard: string;
  priceUsd: number;
  priceMode: string;
  serviceTime: string | null;
  buyerNotice: string | null;
  serviceGuarantee: string | null;
  specialNote: string | null;
  sortOrder: number;
  isActive: boolean;
};

const standardServiceTime =
  "For purchases before warehouse arrival, this service is completed within 24 hours after arrival. For purchases after arrival, it is completed within 24 hours after ordering the service.";

const standardGuarantee =
  "If CNSnap fails to complete the service within the promised timeframe, compensation is credited to the CNSnap account balance according to the service policy.";

const standardSpecialNote =
  "Delays caused by customer confirmation, risk review, public holidays, force majeure, or announced site-wide events are not eligible for compensation.";

export const defaultValueAddedServices: ValueAddedServiceSeed[] = [
  {
    code: "VAS-01",
    name: "Plastic-Sealing Packaging",
    description: "Shrink-wrapping the product helps reduce moisture damage during international shipping.",
    applicableRange: "3C items, bags, shoes, books, toys, and similar products.",
    chargeStandard: "US $1.6/pcs",
    priceUsd: 1.6,
    priceMode: "per_piece",
    serviceTime: standardServiceTime,
    buyerNotice: "The maximum shrink-wrap bag size is 60cm x 40cm. Larger items cannot be shrink-wrapped.",
    serviceGuarantee: standardGuarantee,
    specialNote: standardSpecialNote,
    sortOrder: 1,
    isActive: true
  },
  {
    code: "VAS-02",
    name: "Dust Bag Packaging",
    description: "Dustproof bag packaging helps protect items from dust, scratches, moisture, and sunlight exposure.",
    applicableRange: "Clothing, hats, shoes, and bags.",
    chargeStandard: "US $0.64/pcs",
    priceUsd: 0.64,
    priceMode: "per_piece",
    serviceTime: standardServiceTime,
    buyerNotice: "This processing service may increase product volume. Please confirm before ordering.",
    serviceGuarantee: standardGuarantee,
    specialNote: standardSpecialNote,
    sortOrder: 2,
    isActive: true
  },
  {
    code: "VAS-03",
    name: "Customized EPE Packaging",
    description: "Custom EPE pearl cotton reinforcement provides shock, collision, and scratch protection.",
    applicableRange: "Electronic components, circuit boards, figurines, ceramic products, and fragile items.",
    chargeStandard: "US $3.68 + US $N/pcs",
    priceUsd: 3.68,
    priceMode: "base_plus_quote",
    serviceTime: standardServiceTime,
    buyerNotice: "This service may increase volume. Outer boxes may be discarded if custom reinforcement is requested.",
    serviceGuarantee: standardGuarantee,
    specialNote: "The final material surcharge is confirmed by warehouse staff after checking the product size and packing requirement.",
    sortOrder: 3,
    isActive: true
  },
  {
    code: "VAS-04",
    name: "Split Order / Discard Item",
    description: "Split multiple in-storage items into separate orders or discard specific items to reduce weight or meet mailing restrictions.",
    applicableRange: "Orders with multiple stored items, free gifts, batteries, liquids, or items requiring removal.",
    chargeStandard: "US $0.32/DI",
    priceUsd: 0.32,
    priceMode: "per_split",
    serviceTime: standardServiceTime,
    buyerNotice: "Discarded items cannot be returned or exchanged. Sealed packaging may be opened for inspection.",
    serviceGuarantee: standardGuarantee,
    specialNote: standardSpecialNote,
    sortOrder: 4,
    isActive: true
  },
  {
    code: "VAS-05",
    name: "Model Try-on Photos",
    description: "A live model provides four fit photos: front, back, left-side, and right-side views.",
    applicableRange: "Clothing and footwear, excluding bikinis, intimate apparel, and overly revealing clothing.",
    chargeStandard: "US $4.81/pcs",
    priceUsd: 4.81,
    priceMode: "per_piece",
    serviceTime: standardServiceTime,
    buyerNotice: "Trying on requires unsealing. Model body proportions may differ from the customer's requested profile.",
    serviceGuarantee: standardGuarantee,
    specialNote: "This service is not available for bikinis, intimate apparel, and overly revealing clothing.",
    sortOrder: 5,
    isActive: true
  },
  {
    code: "VAS-06",
    name: "Kraft Bubble Mailer Packaging",
    description: "Kraft paper bubble mailers provide cushioning and shock absorption for small items.",
    applicableRange: "Small jewelry, jade items, documents, IDs, and small electronic products.",
    chargeStandard: "US $0.48/pcs",
    priceUsd: 0.48,
    priceMode: "per_piece",
    serviceTime: standardServiceTime,
    buyerNotice: "This processing service may increase product volume. Please confirm before ordering.",
    serviceGuarantee: standardGuarantee,
    specialNote: standardSpecialNote,
    sortOrder: 6,
    isActive: true
  },
  {
    code: "VAS-07",
    name: "Bubble Cushioning Wrap Packaging",
    description: "Bubble cushioning wrap protects items against compression, collision, and dropping.",
    applicableRange: "Cosmetics, electronic products, figurines, glass jars, and ceramic products.",
    chargeStandard: "US $0.8/pcs",
    priceUsd: 0.8,
    priceMode: "per_piece",
    serviceTime: standardServiceTime,
    buyerNotice: "Outer packaging may be discarded if requested. If no instruction is provided, bubble wrap is applied externally.",
    serviceGuarantee: standardGuarantee,
    specialNote: standardSpecialNote,
    sortOrder: 7,
    isActive: true
  },
  {
    code: "VAS-08",
    name: "Switching Packaging",
    description: "Remove or replace product boxes or bags with CNSnap packaging, opaque packaging, or custom packaging.",
    applicableRange: "Products requiring original packaging removal or replacement.",
    chargeStandard: "US $0.32/pcs",
    priceUsd: 0.32,
    priceMode: "per_piece",
    serviceTime: standardServiceTime,
    buyerNotice: "Products may no longer be returnable after packaging is removed or changed. Fragile items are not recommended.",
    serviceGuarantee: standardGuarantee,
    specialNote: standardSpecialNote,
    sortOrder: 8,
    isActive: true
  },
  {
    code: "VAS-09",
    name: "Detailed Inspection",
    description: "Detailed checks of linings, zippers, pockets, stains, discoloration, scratches, snags, and other defects.",
    applicableRange: "Individual items or products requiring thorough physical and cosmetic quality checks.",
    chargeStandard: "US $0.88/item",
    priceUsd: 0.88,
    priceMode: "per_item",
    serviceTime: standardServiceTime,
    buyerNotice: "Each service randomly covers one item. Sealed packaging is opened by default for detailed inspection.",
    serviceGuarantee: standardGuarantee,
    specialNote: "If no issue is found, no extra notice is sent. Problems will be reported for customer confirmation.",
    sortOrder: 9,
    isActive: true
  },
  {
    code: "VAS-10",
    name: "Product Label Removal",
    description: "Remove labels, price tags, or brand tags after warehouse arrival according to customer instructions.",
    applicableRange: "Products requiring label, price tag, or brand tag removal.",
    chargeStandard: "US $0.48/pcs",
    priceUsd: 0.48,
    priceMode: "per_piece",
    serviceTime: standardServiceTime,
    buyerNotice: "Products may not be eligible for return or exchange after tag removal. Sealed packaging may be opened.",
    serviceGuarantee: standardGuarantee,
    specialNote: standardSpecialNote,
    sortOrder: 10,
    isActive: true
  },
  {
    code: "VAS-11",
    name: "Thread Trimming",
    description: "Post-warehouse thread trimming service performed according to customer specifications.",
    applicableRange: "Clothing products.",
    chargeStandard: "US $0.8/pcs",
    priceUsd: 0.8,
    priceMode: "per_piece",
    serviceTime: standardServiceTime,
    buyerNotice: "Sealed packaging is opened by default for inspection and cannot be restored to the original sealed condition.",
    serviceGuarantee: standardGuarantee,
    specialNote: standardSpecialNote,
    sortOrder: 11,
    isActive: true
  },
  {
    code: "VAS-12",
    name: "Power-on Inspection for 3C and Appliance",
    description: "Power-on/off test for 3C and appliance items, with one photo as evidence of operational status.",
    applicableRange: "Products that can be powered on and off directly. Products requiring assembly are not eligible.",
    chargeStandard: "US $1.92/pcs",
    priceUsd: 1.92,
    priceMode: "per_piece",
    serviceTime: standardServiceTime,
    buyerNotice: "Only power-on and power-off testing is performed. Sealed packaging is opened for inspection.",
    serviceGuarantee: standardGuarantee,
    specialNote: "If purchased quantity does not match the requested inspection quantity, the service may be cancelled.",
    sortOrder: 12,
    isActive: true
  },
  {
    code: "VAS-13",
    name: "Detailed Photo",
    description: "Customized detail photography for selected angles, close-ups, or size measurement needs.",
    applicableRange: "Individual products requiring specific angles, detail close-ups, or custom size measurements.",
    chargeStandard: "US $0.32/pcs (50% off starting from the 3rd piece)",
    priceUsd: 0.32,
    priceMode: "per_photo",
    serviceTime: standardServiceTime,
    buyerNotice: "Each photo covers one angle or detail. Multiple angles require multiple service quantities.",
    serviceGuarantee: "Free retake is available for serious photo issues. Delay compensation follows the service policy.",
    specialNote: "The 50% discount from the 3rd photo is shown in the service standard; V1 cart total uses the configured unit price as an estimate.",
    sortOrder: 13,
    isActive: true
  },
  {
    code: "VAS-14",
    name: "Ironing Service",
    description: "Warehouse ironing service for wrinkled clothing items at the customer's request.",
    applicableRange: "Clothing items, excluding delicate or high-value clothing such as leather and down jackets.",
    chargeStandard: "US $3.2/pcs",
    priceUsd: 3.2,
    priceMode: "per_piece",
    serviceTime: standardServiceTime,
    buyerNotice: "Not recommended for delicate items. Box packing is recommended after ironing to reduce re-creasing.",
    serviceGuarantee: standardGuarantee,
    specialNote: standardSpecialNote,
    sortOrder: 14,
    isActive: true
  },
  {
    code: "VAS-15",
    name: "Product Video Shooting",
    description: "360-degree video shooting service for products.",
    applicableRange: "Individual products requiring comprehensive 360-degree visual documentation.",
    chargeStandard: "US $3.2/pcs",
    priceUsd: 3.2,
    priceMode: "per_piece",
    serviceTime: standardServiceTime,
    buyerNotice: "Video shooting requires unpacking the product. Sealed packaging cannot be restored to original condition.",
    serviceGuarantee: standardGuarantee,
    specialNote: standardSpecialNote,
    sortOrder: 15,
    isActive: true
  },
  {
    code: "VAS-16",
    name: "EPE Packaging",
    description: "Three-layer pearl cotton wrapping for cushioning and shock resistance.",
    applicableRange: "Breakable or fragile products.",
    chargeStandard: "US $0.64/pcs",
    priceUsd: 0.64,
    priceMode: "per_piece",
    serviceTime: standardServiceTime,
    buyerNotice: "This processing service may increase product volume. Outer boxes may be discarded if packaging is requested.",
    serviceGuarantee: standardGuarantee,
    specialNote: standardSpecialNote,
    sortOrder: 16,
    isActive: true
  }
];

export function serializeValueAddedService(service: ValueAddedService): CartValueAddedService {
  return {
    id: service.id,
    code: service.code,
    name: service.name,
    description: service.description,
    applicableRange: service.applicableRange,
    chargeStandard: service.chargeStandard,
    priceUsd: Number(service.priceUsd),
    priceMode: service.priceMode,
    serviceTime: service.serviceTime,
    buyerNotice: service.buyerNotice,
    serviceGuarantee: service.serviceGuarantee,
    specialNote: service.specialNote,
    sortOrder: service.sortOrder,
    isActive: service.isActive
  };
}

export function valueAddedServiceSeedToPrisma(service: ValueAddedServiceSeed): Prisma.ValueAddedServiceCreateInput {
  return {
    code: service.code,
    name: service.name,
    description: service.description,
    applicableRange: service.applicableRange,
    chargeStandard: service.chargeStandard,
    priceUsd: service.priceUsd,
    priceMode: service.priceMode,
    serviceTime: service.serviceTime,
    buyerNotice: service.buyerNotice,
    serviceGuarantee: service.serviceGuarantee,
    specialNote: service.specialNote,
    sortOrder: service.sortOrder,
    isActive: service.isActive
  };
}
