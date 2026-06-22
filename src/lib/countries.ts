import { getCountryDataList } from "countries-list";

export type CountryOption = {
  iso2: string;
  iso3: string;
  name: string;
  label: string;
  currency: string;
  phoneCode: string;
};

export const countryOptions: CountryOption[] = getCountryDataList()
  .filter((country) => country.iso2 && country.name)
  .map((country) => ({
    iso2: country.iso2,
    iso3: country.iso3,
    name: country.name,
    label: `${country.name} (${country.iso2})`,
    currency: country.currency?.[0] ?? "",
    phoneCode: country.phone?.[0] ? `+${country.phone[0]}` : ""
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function countryName(iso2?: string | null) {
  if (!iso2) return "";
  return countryOptions.find((country) => country.iso2 === iso2)?.name ?? iso2;
}

export function countryNameLocalized(iso2?: string | null, locale?: string | null) {
  if (!iso2) return "";

  try {
    const localized = new Intl.DisplayNames([locale || "en"], { type: "region" }).of(iso2.toUpperCase());
    return localized || countryName(iso2);
  } catch {
    return countryName(iso2);
  }
}

export const euCountryCodes = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE"
] as const;

export function isEuCountry(iso2?: string | null) {
  if (!iso2) return false;
  return euCountryCodes.includes(iso2.toUpperCase() as (typeof euCountryCodes)[number]);
}

export type StateOption = {
  code: string;
  name: string;
};

export const stateOptionsByCountry: Record<string, StateOption[]> = {
  US: [
    ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"], ["CO", "Colorado"],
    ["CT", "Connecticut"], ["DE", "Delaware"], ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"],
    ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"],
    ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"],
    ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"],
    ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"],
    ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"],
    ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"],
    ["WI", "Wisconsin"], ["WY", "Wyoming"], ["DC", "District of Columbia"]
  ].map(([code, name]) => ({ code, name })),
  CA: [
    ["AB", "Alberta"], ["BC", "British Columbia"], ["MB", "Manitoba"], ["NB", "New Brunswick"], ["NL", "Newfoundland and Labrador"],
    ["NS", "Nova Scotia"], ["NT", "Northwest Territories"], ["NU", "Nunavut"], ["ON", "Ontario"], ["PE", "Prince Edward Island"],
    ["QC", "Quebec"], ["SK", "Saskatchewan"], ["YT", "Yukon"]
  ].map(([code, name]) => ({ code, name })),
  AU: [
    ["ACT", "Australian Capital Territory"], ["NSW", "New South Wales"], ["NT", "Northern Territory"], ["QLD", "Queensland"],
    ["SA", "South Australia"], ["TAS", "Tasmania"], ["VIC", "Victoria"], ["WA", "Western Australia"]
  ].map(([code, name]) => ({ code, name })),
  BR: [
    ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapa"], ["AM", "Amazonas"], ["BA", "Bahia"], ["CE", "Ceara"],
    ["DF", "Distrito Federal"], ["ES", "Espirito Santo"], ["GO", "Goias"], ["MA", "Maranhao"], ["MT", "Mato Grosso"],
    ["MS", "Mato Grosso do Sul"], ["MG", "Minas Gerais"], ["PA", "Para"], ["PB", "Paraiba"], ["PR", "Parana"],
    ["PE", "Pernambuco"], ["PI", "Piaui"], ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"], ["RS", "Rio Grande do Sul"],
    ["RO", "Rondonia"], ["RR", "Roraima"], ["SC", "Santa Catarina"], ["SP", "Sao Paulo"], ["SE", "Sergipe"], ["TO", "Tocantins"]
  ].map(([code, name]) => ({ code, name })),
  JP: [
    ["01", "Hokkaido"], ["02", "Aomori"], ["03", "Iwate"], ["04", "Miyagi"], ["05", "Akita"], ["06", "Yamagata"],
    ["07", "Fukushima"], ["08", "Ibaraki"], ["09", "Tochigi"], ["10", "Gunma"], ["11", "Saitama"], ["12", "Chiba"],
    ["13", "Tokyo"], ["14", "Kanagawa"], ["15", "Niigata"], ["16", "Toyama"], ["17", "Ishikawa"], ["18", "Fukui"],
    ["19", "Yamanashi"], ["20", "Nagano"], ["21", "Gifu"], ["22", "Shizuoka"], ["23", "Aichi"], ["24", "Mie"],
    ["25", "Shiga"], ["26", "Kyoto"], ["27", "Osaka"], ["28", "Hyogo"], ["29", "Nara"], ["30", "Wakayama"],
    ["31", "Tottori"], ["32", "Shimane"], ["33", "Okayama"], ["34", "Hiroshima"], ["35", "Yamaguchi"], ["36", "Tokushima"],
    ["37", "Kagawa"], ["38", "Ehime"], ["39", "Kochi"], ["40", "Fukuoka"], ["41", "Saga"], ["42", "Nagasaki"],
    ["43", "Kumamoto"], ["44", "Oita"], ["45", "Miyazaki"], ["46", "Kagoshima"], ["47", "Okinawa"]
  ].map(([code, name]) => ({ code, name }))
};

export function getStateOptions(countryCode?: string | null) {
  if (!countryCode) return [];
  return stateOptionsByCountry[countryCode.toUpperCase()] ?? [];
}
