"use client";

import Image from "next/image";
import Link from "next/link";

import { useCurrency } from "@/components/currency/CurrencyProvider";
import { formatProductMoney, resolveProductPriceDisplay } from "@/lib/product-price-display";
import { buildSearchBuyUrl } from "@/lib/source-url";

export type WeidianStoreGridProduct = {
  sourceItemId: string;
  sourceUrl: string;
  title: string;
  priceCny: number;
  mainImage: string;
  attributes: {
    stock?: string;
    soldout?: string;
  };
};

export function WeidianStoreProductGrid({ products }: { products: WeidianStoreGridProduct[] }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ShopProductCard key={product.sourceItemId} product={product} />
      ))}
    </div>
  );
}

function ShopProductCard({ product }: { product: WeidianStoreGridProduct }) {
  const href = buildSearchBuyUrl(product.sourceUrl, product.sourceItemId);
  const stock = product.attributes.stock;
  const soldout = product.attributes.soldout === "1";
  const currency = useCurrency();
  const priceDisplay = resolveProductPriceDisplay({
    selectedCurrency: currency.selectedCurrency,
    priceCny: product.priceCny,
    rates: currency.rates
  });

  return (
    <article className="site-card group overflow-hidden transition hover:border-[#cbd5e1] hover:shadow-[0_18px_40px_rgba(16,24,40,0.10)]">
      <Link href={href}>
        <div className="relative aspect-square bg-white">
          {product.mainImage ? (
            <Image
              src={product.mainImage}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="grid size-full place-items-center bg-[#f7fbff] text-sm font-black text-[#667085]">No image</div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-[#d9142f] px-3 py-1 text-xs font-extrabold uppercase text-white shadow-[0_10px_20px_rgba(217,20,47,0.18)]">
            Weidian
          </span>
        </div>
      </Link>
      <div className="space-y-3 p-4">
        <Link href={href} className="line-clamp-2 min-h-11 font-extrabold leading-snug text-[#101828] hover:text-[#2563eb]">
          {product.title}
        </Link>
        <div className="flex items-end justify-between gap-3">
          <div>
            {priceDisplay.secondaryCurrency && priceDisplay.secondaryAmount !== null ? (
              <div className="text-xs font-semibold text-[#9b92a0]">{formatProductMoney(priceDisplay.secondaryAmount, priceDisplay.secondaryCurrency)}</div>
            ) : null}
            <div className="text-2xl font-extrabold text-[#d9142f]">{formatProductMoney(priceDisplay.primaryAmount, priceDisplay.primaryCurrency)}</div>
          </div>
          <div className="text-right text-xs font-bold text-[#667085]">
            {soldout ? "Sold out" : `Stock ${stock || "-"}`}
          </div>
        </div>
      </div>
    </article>
  );
}
