"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useMemo, useSyncExternalStore } from "react";
import { useLocale } from "next-intl";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import { ensureAuthenticated } from "@/lib/auth-client";
import { buildLocalizedUiHref } from "@/lib/i18n/frontend-routing";
import { cartSnapshot, parseCartSnapshot, subscribeToCart, summarizeCart } from "@/lib/cart-store";
import type { FrontendLocale } from "../../../config/i18n";
import { getSeoLocaleByAppLocale } from "../../../config/i18n";

export function CartStatusButton() {
  const locale = useLocale() as FrontendLocale;
  const publicLocale = getSeoLocaleByAppLocale(locale) || undefined;
  const snapshot = useSyncExternalStore(subscribeToCart, cartSnapshot, () => "[]");
  const items = useMemo(() => parseCartSnapshot(snapshot), [snapshot]);
  const summary = useMemo(() => summarizeCart(items), [items]);
  const { formatUsd } = useCurrency();
  const cartHref = buildLocalizedUiHref("/cart", locale, undefined, publicLocale);

  return (
    <Link
      href={cartHref}
      className="btn-secondary relative px-4 py-2.5"
      title="Cart"
      aria-label={`Cart, ${summary.quantity} items, ${formatUsd(summary.total)}`}
      onClick={async (event) => {
        event.preventDefault();
        if (await ensureAuthenticated(cartHref)) {
          window.location.href = cartHref;
        }
      }}
    >
      <ShoppingCart size={17} />
      <span className="hidden sm:inline">Cart</span>
      {summary.quantity ? (
        <>
          <span className="absolute -right-1.5 -top-2 grid min-w-5 place-items-center rounded-full bg-[#d9142f] px-1.5 text-[11px] font-extrabold leading-5 text-white shadow-sm">
            {summary.quantity}
          </span>
          <span className="hidden rounded-full bg-[#fff3f5] px-2 py-0.5 text-xs font-extrabold text-[#d9142f] lg:inline-flex">
            {formatUsd(summary.total)}
          </span>
        </>
      ) : null}
    </Link>
  );
}
