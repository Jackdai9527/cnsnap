import { countryOptions } from "@/lib/countries";

export function CountrySelect({
  name = "country",
  defaultValue = "US",
  className = "input",
  multiple = false,
  defaultValues
}: {
  name?: string;
  defaultValue?: string;
  className?: string;
  multiple?: boolean;
  defaultValues?: string[];
}) {
  return (
    <select name={name} defaultValue={multiple ? defaultValues : defaultValue} className={className} multiple={multiple}>
      {countryOptions.map((country) => (
        <option key={country.iso2} value={country.iso2}>
          {country.label}
        </option>
      ))}
    </select>
  );
}
