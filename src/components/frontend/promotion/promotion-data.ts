export type PromotionOffer = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  rewardValue: string;
  validUntil: string;
  actionTextKey: string;
  actionHref: string;
  tone: "red" | "blue" | "green";
};

export type RechargeBonus = {
  rechargeAmount: string;
  bonusAmount: string;
  validity: string;
  status: "active" | "limited";
};

export type ShippingCoupon = {
  id: string;
  couponNameKey: string;
  discount: string;
  minimumShippingFee: string;
  applicableCountries: string;
  applicableChannels: string;
  validUntil: string;
};

export type ServiceFeeDiscount = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  discount: string;
  badgeKey: string;
};

export type LimitedCampaign = {
  id: string;
  campaignTitleKey: string;
  campaignDescriptionKey: string;
  startAt: string;
  endAt: string;
  campaignStatus: "active" | "upcoming";
  actionHref: string;
};

export const newUserOffers: PromotionOffer[] = [
  {
    id: "shipping-coupon",
    titleKey: "newUser.offers.shippingCoupon.title",
    descriptionKey: "newUser.offers.shippingCoupon.description",
    rewardValue: "$5",
    validUntil: "2026-12-31",
    actionTextKey: "newUser.offers.shippingCoupon.action",
    actionHref: "/register",
    tone: "red"
  },
  {
    id: "first-order-service",
    titleKey: "newUser.offers.firstOrder.title",
    descriptionKey: "newUser.offers.firstOrder.description",
    rewardValue: "50%",
    validUntil: "2026-12-31",
    actionTextKey: "newUser.offers.firstOrder.action",
    actionHref: "/",
    tone: "blue"
  },
  {
    id: "diy-priority",
    titleKey: "newUser.offers.diyPriority.title",
    descriptionKey: "newUser.offers.diyPriority.description",
    rewardValue: "VIP",
    validUntil: "2026-12-31",
    actionTextKey: "newUser.offers.diyPriority.action",
    actionHref: "/diy-order",
    tone: "green"
  }
];

export const rechargeBonuses: RechargeBonus[] = [
  { rechargeAmount: "$50", bonusAmount: "$2", validity: "30 days", status: "active" },
  { rechargeAmount: "$100", bonusAmount: "$5", validity: "45 days", status: "active" },
  { rechargeAmount: "$300", bonusAmount: "$20", validity: "60 days", status: "active" },
  { rechargeAmount: "$500", bonusAmount: "$40", validity: "90 days", status: "limited" }
];

export const shippingCoupons: ShippingCoupon[] = [
  {
    id: "shipping-5",
    couponNameKey: "coupons.shipping5.name",
    discount: "$5 off",
    minimumShippingFee: "$30",
    applicableCountries: "US, CA, AU",
    applicableChannels: "EMS, Economy Line",
    validUntil: "2026-09-30"
  },
  {
    id: "heavy-10",
    couponNameKey: "coupons.heavy10.name",
    discount: "$10 off",
    minimumShippingFee: "$80",
    applicableCountries: "US, DE, FR, NL, PL",
    applicableChannels: "DHL, FedEx, UPS",
    validUntil: "2026-10-31"
  },
  {
    id: "first-package",
    couponNameKey: "coupons.firstPackage.name",
    discount: "8%",
    minimumShippingFee: "$20",
    applicableCountries: "All supported countries",
    applicableChannels: "All standard lines",
    validUntil: "2026-12-31"
  },
  {
    id: "country-special",
    couponNameKey: "coupons.countrySpecial.name",
    discount: "$12 off",
    minimumShippingFee: "$90",
    applicableCountries: "DE, FR, NL, PL",
    applicableChannels: "Air Cargo, Economy Line",
    validUntil: "2026-08-31"
  }
];

export const serviceFeeDiscounts: ServiceFeeDiscount[] = [
  {
    id: "first-order",
    titleKey: "serviceFee.discounts.firstOrder.title",
    descriptionKey: "serviceFee.discounts.firstOrder.description",
    discount: "50%",
    badgeKey: "serviceFee.badges.new"
  },
  {
    id: "vip",
    titleKey: "serviceFee.discounts.vip.title",
    descriptionKey: "serviceFee.discounts.vip.description",
    discount: "15%",
    badgeKey: "serviceFee.badges.vip"
  },
  {
    id: "campaign",
    titleKey: "serviceFee.discounts.campaign.title",
    descriptionKey: "serviceFee.discounts.campaign.description",
    discount: "10%",
    badgeKey: "serviceFee.badges.limited"
  }
];

export const limitedCampaigns: LimitedCampaign[] = [
  {
    id: "summer-forwarding",
    campaignTitleKey: "items.summer.title",
    campaignDescriptionKey: "items.summer.description",
    startAt: "2026-06-01",
    endAt: "2026-08-31",
    campaignStatus: "active",
    actionHref: "/forwarding"
  },
  {
    id: "back-to-school",
    campaignTitleKey: "items.school.title",
    campaignDescriptionKey: "items.school.description",
    startAt: "2026-08-15",
    endAt: "2026-09-30",
    campaignStatus: "upcoming",
    actionHref: "/"
  }
];

export const promotionRuleKeys = [
  "validTime",
  "minimumOrder",
  "countries",
  "channels",
  "refunds",
  "stacking",
  "abuse"
] as const;
