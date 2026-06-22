"use client";

import { useMemo, useState } from "react";
import { countryOptions, getStateOptions } from "@/lib/countries";

export function AddressRegionFields({
  defaultCountry = "US",
  defaultState = "",
  countryValue,
  stateValue,
  onCountryChange,
  onStateChange,
  countryClassName = "input",
  stateClassName = "input",
  labelClassName = "grid gap-1 text-xs font-bold text-slate-600",
  showLabels = false,
  countryLabel = "Country / region",
  stateLabel = "State / Province",
  cityField
}: {
  defaultCountry?: string;
  defaultState?: string | null;
  countryValue?: string;
  stateValue?: string | null;
  onCountryChange?: (country: string) => void;
  onStateChange?: (state: string) => void;
  countryClassName?: string;
  stateClassName?: string;
  labelClassName?: string;
  showLabels?: boolean;
  countryLabel?: string;
  stateLabel?: string;
  cityField?: React.ReactNode;
}) {
  const [localCountry, setLocalCountry] = useState(defaultCountry || "US");
  const country = countryValue ?? localCountry;
  const states = useMemo(() => getStateOptions(country), [country]);
  const controlledState = stateValue !== undefined;
  const stateInput = states.length ? (
    <select
      key={`state-${country}`}
      name="state"
      value={controlledState ? stateValue ?? "" : undefined}
      defaultValue={controlledState ? undefined : defaultState ?? ""}
      onChange={(event) => onStateChange?.(event.target.value)}
      className={stateClassName}
    >
      <option value="">Select state / province</option>
      {states.map((state) => (
        <option key={state.code} value={state.code}>
          {state.name}
        </option>
      ))}
    </select>
  ) : (
    <input
      name="state"
      value={controlledState ? stateValue ?? "" : undefined}
      defaultValue={controlledState ? undefined : defaultState ?? ""}
      onChange={(event) => onStateChange?.(event.target.value)}
      placeholder="State / Province"
      className={stateClassName}
    />
  );

  const countrySelect = (
    <select
      name="country"
      value={country}
      onChange={(event) => {
        const nextCountry = event.target.value;
        setLocalCountry(nextCountry);
        onCountryChange?.(nextCountry);
        onStateChange?.("");
      }}
      className={countryClassName}
    >
      {countryOptions.map((option) => (
        <option key={option.iso2} value={option.iso2}>
          {option.label}
        </option>
      ))}
    </select>
  );

  if (!showLabels) {
    return (
      <>
        {countrySelect}
        {cityField ? <div className="grid grid-cols-2 gap-3">{stateInput}{cityField}</div> : stateInput}
      </>
    );
  }

  return (
    <>
      <label className={labelClassName}>
        {countryLabel}
        {countrySelect}
      </label>
      <label className={labelClassName}>
        {stateLabel}
        {stateInput}
      </label>
    </>
  );
}
