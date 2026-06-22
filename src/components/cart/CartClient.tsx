"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { Minus, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import { MobileBusinessStepFlow } from "@/components/mobile/business/MobileBusinessStepFlow";
import { MobileSectionShell } from "@/components/mobile/layout/MobileSectionShell";
import {
  cartSnapshot,
  parseCartSnapshot,
  subscribeToCart,
  summarizeCart,
  writeCart,
  type CartItem
} from "@/lib/cart-store";
import { buildOrderFeeSnapshot } from "@/lib/order-fee-snapshot";
import { getSeoLocaleByAppLocale } from "../../../config/i18n";

type CheckoutAddress = {
  id: number;
  label: string;
  contactName: string;
  country: string;
  city: string;
  line1: string;
  isDefault: boolean;
};

export function CartClient({
  addresses = []
}: {
  addresses?: CheckoutAddress[];
}) {
  const locale = useLocale();
  const publicLocale = getSeoLocaleByAppLocale(locale) ?? locale;
  const t = useTranslations("CartPage");
  const snapshot = useSyncExternalStore(subscribeToCart, cartSnapshot, () => "[]");
  const items = useMemo(() => parseCartSnapshot(snapshot), [snapshot]);
  const { formatUsd } = useCurrency();

  function persist(nextItems: CartItem[]) {
    writeCart(nextItems);
  }

  const totals = useMemo(() => summarizeCart(items), [items]);
  const feeSnapshot = useMemo(
    () =>
      buildOrderFeeSnapshot({
        subtotalUsd: totals.subtotalUsd,
        domesticShippingUsd: totals.domesticShippingUsd,
        serviceFeeUsd: totals.serviceFee,
        valueAddedServicesUsd: totals.upsellUsd,
        totalUsd: totals.total
      }),
    [totals]
  );
  const selectedCount = items.reduce((sum, item) => sum + item.quantity, 0);

  function removeItem(index: number) {
    if (!window.confirm(t("cart.confirmDelete"))) return;
    persist(items.filter((_, i) => i !== index));
  }

  return (
    <>
      <MobileSectionShell
        title={t("page.title")}
        description={t("page.description")}
        kicker={t("page.label")}
        className="mobile-cart-page md:hidden"
        minimalHeader
      >
        <section className="card-stack-section">
          <MobileBusinessStepFlow
            steps={[
              {
                key: "cart",
                label: t("page.title"),
                status: "current"
              },
              {
                key: "checkout",
                label: t("summary.action"),
                status: "upcoming"
              }
            ]}
          />
        </section>
        <section className="card-stack-section">
          {items.length ? (
            <div className="mobile-cart-list">
              {items.map((item, index) => (
                <article key={`${item.productId}-${index}`} className="mobile-cart-card">
                  <div className="mobile-cart-card-media">
                    <Image src={item.product.mainImage} alt={item.product.title} fill sizes="96px" className="object-cover" />
                  </div>
                  <div className="mobile-cart-card-body">
                    <div className="mobile-cart-card-top">
                      <span className="mobile-cart-platform">{item.product.platform}</span>
                      <button type="button" className="mobile-cart-remove" onClick={() => removeItem(index)} aria-label={t("cart.remove")}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <h2 className="mobile-cart-title">{item.product.title}</h2>
                    <p className="mobile-cart-sku">{item.skuText ?? t("cart.defaultSku")}</p>
                    <p className="mobile-cart-price">{formatUsd(item.product.priceUsd)}</p>
                    <p className="mobile-cart-meta">CNY ¥{item.product.priceCny.toFixed(2)}</p>
                    <p className="mobile-cart-meta">
                      {t("cart.domesticShipping")}: CNY ¥{(Number(item.chinaFreight) || 0).toFixed(2)}
                    </p>
                    <div className="mobile-cart-qty-row">
                      <div className="mobile-cart-qty">
                        <button
                          type="button"
                          onClick={() =>
                            persist(
                              items.map((candidate, i) =>
                                i === index ? { ...candidate, quantity: Math.max(1, candidate.quantity - 1) } : candidate
                              )
                            )
                          }
                        >
                          <Minus size={15} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            persist(
                              items.map((candidate, i) =>
                                i === index ? { ...candidate, quantity: candidate.quantity + 1 } : candidate
                              )
                            )
                          }
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                      <div className="mobile-cart-line-total">{formatUsd(item.product.priceUsd * item.quantity)}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mobile-cart-empty">
              <h2>{t("empty.title")}</h2>
              <p>{t("empty.description")}</p>
              <Link href={`/${publicLocale}/search`} className="cnsnap-home-mobile-more">
                {t("empty.action")}
              </Link>
            </div>
          )}
        </section>

        {items.length ? (
          <div className="mobile-cart-summary-bar">
            <div className="mobile-cart-summary-bar-inner">
              <div className="mobile-cart-summary-copy">
                <span>{t("summary.selectedItems", { count: selectedCount })}</span>
                <strong>{formatUsd(totals.total)}</strong>
              </div>
              <form action={`/${publicLocale}/checkout`} method="get" className="mobile-cart-summary-action">
                <button className="mobile-cart-checkout-btn" disabled={!items.length}>
                  {t("summary.action")}
                </button>
              </form>
            </div>
          </div>
        ) : null}
      </MobileSectionShell>

      <div className="hidden gap-6 md:grid lg:grid-cols-[1fr_360px]">
        <section className="space-y-3">
          {items.length ? (
            items.map((item, index) => (
              <div key={`${item.productId}-${index}`} className="panel grid gap-4 p-4 sm:grid-cols-[110px_1fr_auto]">
                <div className="relative aspect-square bg-white">
                  <Image src={item.product.mainImage} alt={item.product.title} fill sizes="120px" className="object-cover" />
                </div>
                <div>
                  <div className="badge uppercase">{item.product.platform}</div>
                  <h2 className="mt-2 font-semibold">{item.product.title}</h2>
                  <p className="mt-1 text-sm text-[#667085]">{item.skuText ?? t("cart.defaultSku")}</p>
                  <p className="mt-2 text-sm">CNY ¥{item.product.priceCny.toFixed(2)} · {formatUsd(item.product.priceUsd)}</p>
                  <p className="mt-1 text-xs font-semibold text-[#667085]">{t("cart.domesticShipping")}: CNY ¥{(Number(item.chinaFreight) || 0).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  <div className="flex overflow-hidden rounded-xl border border-[#d9e7ff] bg-white">
                    <button className="p-2" onClick={() => persist(items.map((candidate, i) => i === index ? { ...candidate, quantity: Math.max(1, candidate.quantity - 1) } : candidate))}>
                      <Minus size={15} />
                    </button>
                    <span className="grid w-10 place-items-center text-sm font-semibold">{item.quantity}</span>
                    <button className="p-2" onClick={() => persist(items.map((candidate, i) => i === index ? { ...candidate, quantity: candidate.quantity + 1 } : candidate))}>
                      <Plus size={15} />
                    </button>
                  </div>
                  <button className="btn-secondary px-3" onClick={() => removeItem(index)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="panel p-10 text-center">
              <h2 className="font-display text-3xl font-semibold">{t("empty.title")}</h2>
              <p className="mt-2 text-[#667085]">{t("empty.description")}</p>
              <Link href={`/${publicLocale}/search`} className="btn-primary mt-5">{t("empty.action")}</Link>
            </div>
          )}

        </section>
        <aside className="panel h-fit p-5">
          <h2 className="font-display text-2xl font-semibold">{t("summary.title")}</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><dt>{t("summary.products")}</dt><dd>{formatUsd(feeSnapshot.itemsSubtotalUsd)}</dd></div>
            <div className="flex justify-between"><dt>{t("summary.domesticShipping")}</dt><dd>{formatUsd(feeSnapshot.domesticShippingUsd)}</dd></div>
            <div className="flex justify-between"><dt>{t("summary.serviceFee")}</dt><dd>{formatUsd(feeSnapshot.serviceFeeUsd)}</dd></div>
            <div className="rounded-2xl bg-[#f7fbff] px-3 py-2 text-xs font-semibold leading-5 text-[#667085]">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 shrink-0" size={14} />
                <span>{t("summary.notice")}</span>
              </div>
            </div>
            <div className="flex justify-between border-t border-[#d9e7ff] pt-3 text-base font-semibold"><dt>{t("summary.total")}</dt><dd>{formatUsd(feeSnapshot.orderTotalUsd)}</dd></div>
          </dl>
          <form action={`/${publicLocale}/checkout`} method="get" className="mt-5">
            {addresses.length ? (
              <div className="mb-3 rounded-2xl border border-[#d9e7ff] bg-[#fffafd] p-3 text-xs font-bold leading-5 text-[#667085]">
                {t("summary.savedAddressNotice", { count: addresses.length })}
              </div>
            ) : (
              <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800">
                {t("summary.noAddressNotice")}
              </div>
            )}
            <button className="btn-primary mt-3 w-full" disabled={!items.length}>{t("summary.action")}</button>
          </form>
        </aside>
      </div>
    </>
  );
}
