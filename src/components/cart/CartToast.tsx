"use client";

import Link from "next/link";
import { CheckCircle2, ShoppingCart, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import { ensureAuthenticated } from "@/lib/auth-client";
import { buildLocalizedUiHref } from "@/lib/i18n/frontend-routing";
import { cartToastEvent, type CartSummary } from "@/lib/cart-store";
import type { FrontendLocale } from "../../../config/i18n";
import { getSeoLocaleByAppLocale } from "../../../config/i18n";

type ToastState = {
  title: string;
  message: string;
  summary?: CartSummary;
};

export function CartToast() {
  const locale = useLocale() as FrontendLocale;
  const publicLocale = getSeoLocaleByAppLocale(locale) || undefined;
  const [toast, setToast] = useState<ToastState | null>(null);
  const { formatUsd } = useCurrency();
  const cartHref = buildLocalizedUiHref("/cart", locale, undefined, publicLocale);
  const checkoutHref = buildLocalizedUiHref("/checkout", locale, undefined, publicLocale);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    function onToast(event: Event) {
      const detail = (event as CustomEvent<ToastState>).detail;
      setToast(detail);
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => setToast(null), 4200);
    }

    window.addEventListener(cartToastEvent, onToast);
    return () => {
      window.removeEventListener(cartToastEvent, onToast);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  if (!toast) return null;

  return (
    <section className="fixed right-4 top-[104px] z-50 w-[min(380px,calc(100vw-2rem))] rounded-xl border border-[#dfe7f1] bg-white p-4 shadow-[0_20px_48px_rgba(16,24,40,0.16)]">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={21} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-extrabold text-[#101828]">{toast.title}</div>
          <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-[#667085]">{toast.message}</p>
          {toast.summary ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-extrabold text-[#667085]">
              <span className="rounded-full bg-[#fff3f5] px-3 py-1 text-[#d9142f]">{toast.summary.quantity} items</span>
              <span>{formatUsd(toast.summary.total)}</span>
            </div>
          ) : null}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href={cartHref} className="btn-secondary px-3 py-2 text-xs" onClick={async (event) => {
              event.preventDefault();
              if (await ensureAuthenticated(cartHref)) window.location.href = cartHref;
            }}>
              <ShoppingCart size={15} />
              View cart
            </Link>
            <Link href={checkoutHref} className="btn-primary px-3 py-2 text-xs" onClick={async (event) => {
              event.preventDefault();
              if (await ensureAuthenticated(checkoutHref)) window.location.href = checkoutHref;
            }}>
              Checkout
            </Link>
          </div>
        </div>
        <button type="button" className="rounded-full p-1 text-[#98a2b3] transition hover:bg-[#f8fafc] hover:text-[#d9142f]" onClick={() => setToast(null)} aria-label="Close cart notification">
          <X size={16} />
        </button>
      </div>
    </section>
  );
}
