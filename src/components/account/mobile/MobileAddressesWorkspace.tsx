"use client";

import * as React from "react";
import { MobileAccountListToolbar } from "@/components/account/mobile/MobileAccountListToolbar";
import type { AccountAddress } from "@/types/address";

type AddressFilter = "all" | "default" | "supported";

export function MobileAddressesWorkspace({
  title,
  description,
  addresses,
  renderRow,
  allLabel,
  defaultLabel,
  supportedLabel
}: {
  title: string;
  description: string;
  addresses: AccountAddress[];
  renderRow: (address: AccountAddress) => React.ReactNode;
  allLabel: string;
  defaultLabel: string;
  supportedLabel: string;
}) {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<AddressFilter>("all");

  const filtered = React.useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return addresses.filter((address) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "default" && address.isDefault) ||
        (filter === "supported" && address.supported);
      const haystack = [
        address.firstName,
        address.lastName,
        address.city,
        address.state,
        address.country,
        address.email,
        address.phone
      ]
        .join(" ")
        .toLowerCase();
      return matchesFilter && (!keyword || haystack.includes(keyword));
    });
  }, [addresses, filter, query]);

  return (
    <>
      <MobileAccountListToolbar
        searchValue={query}
        searchPlaceholder={title}
        onSearchChange={setQuery}
        filterValue={filter}
        onFilterChange={(value) => setFilter(value as AddressFilter)}
        filterOptions={[
          { label: allLabel, value: "all" },
          { label: defaultLabel, value: "default" },
          { label: supportedLabel, value: "supported" }
        ]}
        filterAriaLabel={title}
      />
      <div className="mt-3 mobile-account-list">
        {filtered.length ? filtered.map((address) => renderRow(address)) : (
          <div className="mobile-cart-empty">
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        )}
      </div>
    </>
  );
}
