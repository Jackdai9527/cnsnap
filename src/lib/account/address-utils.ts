import { dgeubSupportedCountries } from "@/lib/dgeub-rates";

export function isShippingCountrySupported(countryCode?: string | null) {
  if (!countryCode) return false;
  return dgeubSupportedCountries.includes(countryCode.toUpperCase());
}
