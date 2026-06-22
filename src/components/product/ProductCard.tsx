"use client";

import Link from "next/link";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { useLocale } from "next-intl";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import type { NormalizedProduct } from "@/integrations/onebound/types";
import { formatProductMoney, resolveProductPriceDisplay } from "@/lib/product-price-display";
import { buildBuyUrl } from "@/lib/source-url";
import { getSeoLocaleByAppLocale } from "../../../config/i18n";

export function ProductCard({ product }: { product: NormalizedProduct }) {
  const locale = useLocale();
  const publicLocale = getSeoLocaleByAppLocale(locale) ?? locale;
  const href = buildBuyUrl(product.sourceUrl, publicLocale);
  const currency = useCurrency();
  const priceDisplay = resolveProductPriceDisplay({
    selectedCurrency: currency.selectedCurrency,
    priceCny: product.priceCny,
    priceUsd: product.priceUsd,
    rates: currency.rates
  });

  return (
    <article className="site-card group overflow-hidden transition hover:border-[#ddd6cd] hover:shadow-[0_14px_30px_rgba(16,24,40,0.08)]">
      <Link href={href}>
        <div className="relative aspect-[4/3] bg-white">
          <Image
            src={product.mainImage}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
          <span className="absolute left-3 top-3 rounded-full border border-white/80 bg-[#fffaf7] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#d9142f] shadow-[0_8px_16px_rgba(16,24,40,0.08)]">
            {product.platform}
          </span>
        </div>
      </Link>
      <div className="space-y-3 p-4">
        <div>
          <Link href={href} className="line-clamp-2 font-semibold leading-snug text-[#16202f] hover:text-[#d9142f]">
            {product.title}
          </Link>
          <p className="mt-1 text-sm text-[#616b7c]">{product.shopName}</p>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            {priceDisplay.secondaryCurrency && priceDisplay.secondaryAmount !== null ? (
              <div className="text-xs font-medium text-[#8a8290]">{formatProductMoney(priceDisplay.secondaryAmount, priceDisplay.secondaryCurrency)}</div>
            ) : null}
            <div className="text-2xl font-bold text-[#d9142f]">{formatProductMoney(priceDisplay.primaryAmount, priceDisplay.primaryCurrency)}</div>
          </div>
          <Link href={href} className="btn-secondary px-3 py-2">
            <ExternalLink size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
