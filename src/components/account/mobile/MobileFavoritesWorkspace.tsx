"use client";

import * as React from "react";
import { MobileAccountListToolbar } from "@/components/account/mobile/MobileAccountListToolbar";
import { StoredProductList } from "@/components/user/StoredProductList";

export function MobileFavoritesWorkspace({
  searchPlaceholder
}: {
  searchPlaceholder: string;
}) {
  const [query, setQuery] = React.useState("");

  return (
    <>
      <MobileAccountListToolbar
        searchValue={query}
        searchPlaceholder={searchPlaceholder}
        onSearchChange={setQuery}
        filterOptions={[]}
      />
      <div className="mt-3">
        <StoredProductList type="favorites" variant="mobile-list" query={query} />
      </div>
    </>
  );
}
