"use client";

import Link from "next/link";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import { formatProductMoney, resolveProductPriceDisplay } from "@/lib/product-price-display";
import { buildBuyUrl } from "@/lib/source-url";

export type HomeProduct = {
  id: number;
  sourceUrl: string;
  mainImage: string;
  platform: string;
  title: string;
  priceCny: number;
  shopName?: string;
  sourceItemId: string;
};

export function HomeProductGrid({
  products,
  buyLocale = "en"
}: {
  products: HomeProduct[];
  buyLocale?: string;
}) {
  const currency = useCurrency();

  return (
    <div className="home-product-grid grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => {
        const priceDisplay = resolveProductPriceDisplay({
          selectedCurrency: currency.selectedCurrency,
          priceCny: product.priceCny,
          rates: currency.rates
        });

        return (
          <Link
            key={product.id}
            href={buildBuyUrl(product.sourceUrl, buyLocale)}
            className="home-product-card group overflow-hidden rounded-[16px] border border-[#e8e4dd] bg-white shadow-[0_10px_24px_rgba(16,24,40,0.06)] transition hover:border-[#ddd6cd] hover:shadow-[0_14px_30px_rgba(16,24,40,0.08)]"
          >
            <div className="home-product-card-media aspect-square bg-cover bg-center transition duration-300 group-hover:scale-[1.03]" style={{ backgroundImage: `url(${product.mainImage})` }} />
            <div className="home-product-card-body p-4">
              <div className="home-product-card-platform mb-2 inline-flex rounded-full border border-[#efe8df] bg-[#faf7f2] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#d9142f]">{product.platform}</div>
              <h3 className="home-product-card-title line-clamp-2 text-sm font-semibold leading-5 text-[#16202f]">{product.title}</h3>
              {product.shopName ? <p className="home-product-card-shop mt-2 line-clamp-1 text-xs font-medium text-[#616b7c]">{product.shopName}</p> : null}
              {priceDisplay.secondaryCurrency && priceDisplay.secondaryAmount !== null ? (
                <div className="home-product-card-base mt-3 text-xs font-medium text-[#8a8290]">{formatProductMoney(priceDisplay.secondaryAmount, priceDisplay.secondaryCurrency)}</div>
              ) : null}
              <p className="home-product-card-price mt-2 text-[20px] font-bold text-[#d9142f]">{formatProductMoney(priceDisplay.primaryAmount, priceDisplay.primaryCurrency)}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
