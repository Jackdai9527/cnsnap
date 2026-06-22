"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type ToolbarOption = {
  label: string;
  value: string;
};

type MobileAccountListToolbarProps = {
  searchValue?: string;
  searchPlaceholder: string;
  onSearchChange?: (value: string) => void;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: ToolbarOption[];
  filterAriaLabel?: string;
};

export function MobileAccountListToolbar({
  searchValue = "",
  searchPlaceholder,
  onSearchChange,
  filterValue = "",
  onFilterChange,
  filterOptions = [],
  filterAriaLabel = "Filter"
}: MobileAccountListToolbarProps) {
  return (
    <div className="mobile-order-toolbar">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(event) => onSearchChange?.(event.target.value)}
          className="mobile-orders-search-input pl-9"
        />
      </div>
      {filterOptions.length ? (
        <select
          value={filterValue}
          onChange={(event) => onFilterChange?.(event.target.value)}
          className="mobile-orders-filter-select"
          aria-label={filterAriaLabel}
        >
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
