export const diyUseCaseKeys = [
  "cannotParse",
  "imageOnly",
  "complexSpecs",
  "manualQuote",
  "multipleItems",
  "shippingUncertain"
] as const;

export const quotationStepKeys = [
  "submit",
  "review",
  "quote",
  "confirm",
  "purchase",
  "warehouse",
  "shipping",
  "receive"
] as const;

export const exampleRequestKeys = [
  "imageNoLink",
  "tooManySku",
  "multipleSellers",
  "shippingCheck"
] as const;

export const faqKeys = [
  "quoteTime",
  "imageOnly",
  "payBeforeQuote",
  "afterAccept",
  "cancel",
  "restricted"
] as const;

export const destinationCountryOptions = [
  { code: "US" },
  { code: "CA" },
  { code: "GB" },
  { code: "DE" },
  { code: "FR" },
  { code: "NL" },
  { code: "PL" },
  { code: "JP" },
  { code: "KR" },
  { code: "AU" }
];
