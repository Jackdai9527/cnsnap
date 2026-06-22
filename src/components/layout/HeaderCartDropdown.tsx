"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingCart, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useSyncExternalStore } from "react";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import { ensureAuthenticated } from "@/lib/auth-client";
import { cartSnapshot, parseCartSnapshot, removeCartItem, subscribeToCart, summarizeCart } from "@/lib/cart-store";
import { useLocale } from "next-intl";
import { resolveFrontendHrefForLocale } from "@/modules/seo/lib/route-resolver";
import { getSeoLocaleByAppLocale, type FrontendLocale } from "../../../config/i18n";

export function HeaderCartDropdown() {
  const locale = useLocale() as FrontendLocale;
  const publicLocale = getSeoLocaleByAppLocale(locale) ?? locale;
  const t = useTranslations("common.header.cart");
  const snapshot = useSyncExternalStore(subscribeToCart, cartSnapshot, () => "[]");
  const items = useMemo(() => parseCartSnapshot(snapshot), [snapshot]);
  const summary = useMemo(() => summarizeCart(items), [items]);
  const { formatUsd } = useCurrency();
  const cartHref = resolveFrontendHrefForLocale({ pathname: "/cart", locale });
  const checkoutHref = resolveFrontendHrefForLocale({ pathname: "/checkout", locale });
  const searchHref = `/${publicLocale}/search`;

  async function guardedNavigate(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
    event.preventDefault();
    if (await ensureAuthenticated(href)) {
      window.location.href = href;
    }
  }

  return (
    <div className="header-dropdown-group">
      <Link
        href={cartHref}
        className="btn-secondary relative px-4 py-2.5 text-[#4b5565]"
        title={t("title")}
        aria-label={`${t("title")}, ${summary.quantity} items, ${formatUsd(summary.total)}`}
        onClick={(event) => guardedNavigate(event, cartHref)}
      >
        <ShoppingCart size={17} />
        <span className="hidden sm:inline">{t("title")}</span>
        {summary.quantity ? (
          <>
            <span className="absolute -right-1.5 -top-2 grid min-w-5 place-items-center rounded-full bg-[#d9142f] px-1.5 text-[11px] font-extrabold leading-5 text-white shadow-sm">
              {summary.quantity}
            </span>
            <span className="hidden rounded-full border border-[#efe8df] bg-[#faf7f2] px-2 py-0.5 text-xs font-bold text-[#d9142f] lg:inline-flex">
              {formatUsd(summary.total)}
            </span>
          </>
        ) : null}
      </Link>

      <div className="header-dropdown-panel header-cart-panel" role="menu" aria-label="Cart preview">
        <div className="flex items-start justify-between gap-4 border-b border-[#f0ece5] px-4 py-3">
          <div>
            <div className="text-sm font-bold text-[#16202f]">{t("previewTitle")}</div>
            <p className="mt-0.5 text-xs font-medium text-[#616b7c]">{t("itemsReady", { count: summary.quantity })}</p>
          </div>
          <span className="rounded-full border border-[#efe8df] bg-[#faf7f2] px-3 py-1 text-xs font-bold text-[#d9142f]">{formatUsd(summary.total)}</span>
        </div>

        {items.length ? (
          <>
            <div className="max-h-[320px] overflow-y-auto px-2 py-2">
              {items.slice(0, 5).map((item, index) => (
                <div key={`${item.productId}-${item.skuId ?? "sku"}-${index}`} className="group grid grid-cols-[56px_minmax(0,1fr)_auto] gap-3 rounded-2xl px-2 py-2 transition hover:bg-[#fcfbf9]">
                  <div className="relative size-14 overflow-hidden rounded-xl border border-[#f0ece5] bg-white">
                    <Image src={item.product.mainImage} alt={item.product.title} fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="line-clamp-1 text-sm font-semibold text-[#16202f]">{item.product.title}</div>
                    <div className="mt-1 line-clamp-1 text-xs font-medium text-[#616b7c]">{item.skuText ?? t("defaultSku")}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-[#616b7c]">
                      <span>{t("quantity", { count: item.quantity })}</span>
                      <span>{formatUsd(item.product.priceUsd * item.quantity)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="grid size-8 place-items-center rounded-full text-[#98a2b3] opacity-80 transition hover:bg-[#fff3f5] hover:text-[#d9142f] group-hover:opacity-100"
                    aria-label={`Remove ${item.product.title} from cart`}
                    onClick={() => removeCartItem(index)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {items.length > 5 ? (
                <div className="px-4 py-2 text-xs font-bold text-[#667085]">{t("moreItems", { count: items.length - 5 })}</div>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-[#f0ece5] p-3">
              <Link href={cartHref} className="btn-secondary justify-center px-3 py-2 text-xs" onClick={(event) => guardedNavigate(event, cartHref)}>
                {t("viewCart")}
              </Link>
              <Link href={checkoutHref} className="btn-primary justify-center px-3 py-2 text-xs" onClick={(event) => guardedNavigate(event, checkoutHref)}>
                {t("checkout")} <ArrowRight size={14} />
              </Link>
            </div>
          </>
        ) : (
          <div className="px-4 py-7 text-center">
            <div className="mx-auto grid size-11 place-items-center rounded-full border border-[#efe8df] bg-[#faf7f2] text-[#d9142f]">
              <ShoppingCart size={20} />
            </div>
            <div className="mt-3 text-sm font-bold text-[#16202f]">{t("emptyTitle")}</div>
            <p className="mt-1 text-xs font-medium leading-5 text-[#616b7c]">{t("emptyDescription")}</p>
            <Link href={searchHref} className="btn-primary mt-4 px-4 py-2 text-xs">
              {t("searchProducts")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
