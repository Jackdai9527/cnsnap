"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

export function MobileHeaderSearchLink({ href }: { href: string }) {
  const searchT = useTranslations("common.header.search");

  return (
    <Link href={href} className="cnsnap-mobile-search-link" aria-label={searchT("placeholder")}>
      <Search size={16} />
      <span>{searchT("placeholder")}</span>
    </Link>
  );
}
