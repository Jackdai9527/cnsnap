"use client";

import Image from "next/image";
import Link from "next/link";
import { Calculator, ChevronDown, Heart, MapPin, MessageCircle, Plane, ShoppingCart, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import type { NormalizedProduct } from "@/integrations/onebound/types";
import { ensureAuthenticated } from "@/lib/auth-client";
import { addCartItem } from "@/lib/cart-store";
import { buildSkuOptionGroups, findMatchingSku } from "@/lib/sku-options";
import { countryOptions } from "@/lib/countries";

type ProductBuyControlsProps = {
  productId: number;
  product: NormalizedProduct;
  sourceUrl?: string;
};

const paymentLogos = [
  { title: "Visa", src: "/payment-logos/card_visa.svg" },
  { title: "Mastercard", src: "/payment-logos/card_mastercard.svg" },
  { title: "American Express", src: "/payment-logos/card_american-express.svg" },
  { title: "Discover", src: "/payment-logos/card_discover.svg" },
  { title: "Apple Pay", src: "/payment-logos/card_apple-pay.svg" },
  { title: "Google Pay", src: "/payment-logos/card_google-pay.svg" }
];

const shippingMethods = [
  { name: "Air Standard", days: "8-15 days", price: 18.6, badge: "Recommended" },
  { name: "Economy Packet", days: "15-25 days", price: 12.8, badge: "Lowest" }
];

export function ProductBuyControls({ productId, product, sourceUrl }: ProductBuyControlsProps) {
  const optionGroups = useMemo(() => buildSkuOptionGroups(product), [product]);
  const initialSelection = useMemo(
    () => Object.fromEntries(optionGroups.map((group) => [group.name, group.values[0]?.key ?? ""])),
    [optionGroups]
  );
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(initialSelection);
  const [quantity, setQuantity] = useState(1);
  const [chinaFreight, setChinaFreight] = useState("0");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const selectedSku = useMemo(() => findMatchingSku(product, selectedOptions) ?? product.skus[0], [product, selectedOptions]);
  const { formatCny, formatUsd } = useCurrency();

  function selectOption(groupName: string, valueKey: string, image?: string) {
    const nextSelection = { ...selectedOptions, [groupName]: valueKey };
    setSelectedOptions(nextSelection);
    const nextSku = findMatchingSku(product, nextSelection);
    const variantImage = image || nextSku?.options?.find((option) => option.image)?.image;
    if (variantImage) {
      window.dispatchEvent(new CustomEvent("cnsnap:variant-image-change", { detail: { image: variantImage } }));
    }
  }

  async function addToCart() {
    if (!(await ensureAuthenticated())) return false;
    addCartItem({
      productId,
      product: {
        platform: product.platform,
        sourceItemId: product.sourceItemId,
        title: product.title,
        mainImage: product.mainImage,
        priceCny: product.priceCny,
        priceUsd: product.priceUsd
      },
      skuId: selectedSku?.id,
      skuText: selectedSku?.text,
      quantity,
      chinaFreight: Number(chinaFreight) || 0
    });
    return true;
  }

  return (
    <div className="space-y-5">
      <div className="goods-sizes">
        {optionGroups.map((group) => {
          const selectedValue = group.values.find((value) => value.key === selectedOptions[group.name]);
          return (
            <dl key={group.name} className="goods-options-row mb-4">
              <dt className="goods-options-label mb-2">
                <span className="good-propName font-bold text-[#111827]">{group.name}</span>
                {selectedValue ? <span className="select-tips ml-2 text-xs text-[#667085]">Selected: {selectedValue.label} items</span> : null}
              </dt>
              <dd className="goods-options-content">
                <ul className="goods-options-tags flex flex-wrap gap-2">
                  {group.values.map((value) => {
                    const active = selectedOptions[group.name] === value.key;
                    const isImage = Boolean(value.image);
                    return (
                      <li key={value.key} className={`sku-item en ${active ? "active" : ""} ${isImage ? "img-li" : "text-li"}`}>
                        <button
                          type="button"
                          className={`goods-props-image rounded-md border bg-white text-sm transition ${active ? "border-[#e60012] bg-[#fff1f2] text-[#e60012] ring-2 ring-[#e60012]/15" : "border-[#d9e7ff] text-[#667085] hover:border-[#e60012]"}`}
                          onClick={() => selectOption(group.name, value.key, value.image)}
                        >
                          {isImage ? (
                            <span className="sku-item-content flex items-center gap-2 px-2 py-1">
                              <span className="image-wrapper">
                                <span className="common-img-wrap relative block size-7 overflow-hidden rounded" title={value.label}>
                                  <Image src={value.image!} referrerPolicy="no-referrer" alt="common-img" draggable={false} fill sizes="28px" className="common-img object-cover" />
                                </span>
                              </span>
                              <span className="sku-name max-w-[220px] truncate" title={value.label}>
                                &nbsp;{value.label}&nbsp;
                              </span>
                            </span>
                          ) : (
                            <span title={value.label} className="sku-text block min-w-10 px-3 py-2 text-center">
                              {value.label}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </dd>
            </dl>
          );
        })}
        <div className="shopping-tools-list relative mt-2 flex flex-col gap-3 rounded-xl bg-[#f8fbff] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="component shopping-tools shopping-tools-en relative">
            <button type="button" className="name inline-flex h-10 items-center gap-2 rounded-md bg-white px-3 text-sm font-bold text-[#111827] shadow-sm ring-1 ring-slate-200" onClick={() => setAssistantOpen((current) => !current)}>
              <span>Shopping Assistant</span>
              <ChevronDown size={14} className={`transition ${assistantOpen ? "rotate-180" : ""}`} />
            </button>
            {assistantOpen ? (
              <ul className="tools-link-list absolute left-0 top-[calc(100%+8px)] z-20 w-56 rounded-xl border border-[#d9e7ff] bg-white py-2 text-sm font-semibold text-[#667085] shadow-xl">
                <li className="link-item"><Link className="block px-4 py-2 hover:bg-[#f7fbff] hover:text-[#e60012]" href="/en/page/query/freight/" target="_blank">Shipping Calculator &gt;</Link></li>
                <li className="link-item"><Link className="block px-4 py-2 hover:bg-[#f7fbff] hover:text-[#e60012]" href="/en/page/transport/" target="_blank">Forwarding &gt;</Link></li>
                <li className="link-item"><Link className="block px-4 py-2 hover:bg-[#f7fbff] hover:text-[#e60012]" href="/en/page/query/package/" target="_blank">Parcel Tracking &gt;</Link></li>
                <li className="link-item"><Link className="block px-4 py-2 hover:bg-[#f7fbff] hover:text-[#e60012]" href="/en/page/account/consult/before-sale" target="_blank">Shopping Enquiry &gt;</Link></li>
              </ul>
            ) : null}
          </div>
          <button type="button" className="image-switcher image self-start rounded-md border border-[#d9e7ff] bg-white px-3 py-2 text-xs font-bold text-[#667085]">
            Image
          </button>
        </div>
      </div>

      <div className="goods-options-row">
        <div className="goods-options-label font-bold text-[#111827]">Quantity</div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div className="inline-flex h-10 overflow-hidden rounded-md border border-[#d9e7ff] bg-white">
          <button type="button" className="w-10 text-lg text-[#667085] hover:bg-[#f7fbff]" onClick={() => setQuantity((current) => Math.max(1, current - 1))}>
            -
          </button>
          <input
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
            className="w-14 border-x border-[#d9e7ff] text-center text-sm outline-none"
            type="number"
            min={1}
          />
          <button type="button" className="w-10 text-lg text-[#667085] hover:bg-[#f7fbff]" onClick={() => setQuantity((current) => current + 1)}>
            +
          </button>
          </div>
          <span className="text-xs text-[#667085]">Matched stock: {selectedSku?.stock ?? 0}</span>
        </div>
      </div>

      <dl className="goods-options-row goods-options-freight rounded-2xl border border-[#d9e7ff] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
        <dt className="mb-4 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-black text-[#111827]">
            <Truck size={18} className="text-[#e60012]" />
            Order-stage fees
          </span>
          <Link target="_blank" href="/shipping-calculator" className="inline-flex items-center gap-1 text-xs font-bold text-[#e60012]">
            <Calculator size={14} />
            Calculator
          </Link>
        </dt>
        <dd className="en new-goods-options-content space-y-4">
          <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 rounded-2xl bg-[#f7fbff] p-3 text-center text-xs font-bold text-[#667085]">
            <div className="rounded-xl bg-white px-2 py-3 shadow-sm">
              <MapPin className="mx-auto mb-1 text-[#e60012]" size={16} />
              Seller
              <p className="mt-1 font-normal text-[#a39ba6]">China</p>
            </div>
            <span className="text-[#e60012]">›</span>
            <div className="rounded-xl bg-white px-2 py-3 shadow-sm">
              <ShoppingCart className="mx-auto mb-1 text-[#e60012]" size={16} />
              Warehouse
              <p className="mt-1 font-normal text-[#a39ba6]">Guangdong</p>
            </div>
            <span className="text-[#e60012]">›</span>
            <div className="rounded-xl bg-white px-2 py-3 shadow-sm">
              <Plane className="mx-auto mb-1 text-[#e60012]" size={16} />
              Address
              <p className="mt-1 font-normal text-[#a39ba6]">International</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label htmlFor="goods-freight" className="rounded-xl border border-[#d9e7ff] bg-[#f7fbff] p-3">
              <span className="block text-xs font-bold text-[#667085]">China shipping fee</span>
              <span className="mt-2 flex h-10 items-center rounded-lg bg-white px-3 ring-1 ring-slate-200">
                <em className="goods-freight-rmb mr-1 text-sm not-italic text-[#667085]">CN￥</em>
                <input id="goods-freight" type="text" maxLength={8} min={0} className="goods-freight en min-w-0 flex-1 border-0 text-sm font-bold outline-none" value={chinaFreight} onChange={(event) => setChinaFreight(event.target.value)} />
                <span className="foreign-currency text-xs font-bold text-[#a39ba6]">≈{formatCny(Number(chinaFreight) || 0)}</span>
              </span>
            </label>

            <label className="rounded-xl border border-[#d9e7ff] bg-[#f7fbff] p-3">
              <span className="block text-xs font-bold text-[#667085]">International shipping later</span>
              <span className="mt-2 flex h-10 items-center rounded-lg bg-white px-3 ring-1 ring-slate-200">
                <select className="country-select-search min-w-0 flex-1 border-0 bg-white text-sm font-bold text-[#111827] outline-none focus:ring-0" defaultValue="US">
                  {countryOptions.map((country) => (
                    <option key={country.iso2} value={country.iso2}>{country.label}</option>
                  ))}
                </select>
              </span>
            </label>
          </div>

          <div className="grid gap-2">
            {shippingMethods.map((method) => (
              <div key={method.name} className="flex items-center justify-between gap-3 rounded-xl border border-[#d9e7ff] bg-white p-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[#111827]">{method.name}</span>
                    <span className="rounded-full bg-[#fff1f2] px-2 py-0.5 text-[11px] font-bold text-[#e60012]">{method.badge}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#667085]">Reference only. Final international shipping is confirmed after warehouse check and is not charged when you submit the order.</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-[#e60012]">{formatUsd(method.price)}</p>
                  <Link target="_blank" href={`/help?link=${encodeURIComponent(sourceUrl ?? product.sourceUrl)}`} className="text-xs font-bold text-[#e60012]">Consult</Link>
                </div>
              </div>
            ))}
          </div>
        </dd>
      </dl>

      <div className="support-pay-list rounded-xl border border-[#d9e7ff] bg-white p-2">
        <dl className="flex w-full flex-nowrap items-center gap-1.5 overflow-hidden sm:gap-2">
          <dt className="goods-options-label goods-mark mr-1 shrink-0 whitespace-nowrap text-[11px] font-bold text-[#111827] sm:mr-2 sm:text-sm">Support Payment</dt>
          {paymentLogos.map((item) => (
            <dd key={item.title} title={item.title} className="pay-icon grid h-7 min-w-0 flex-1 place-items-center rounded-md border border-[#d9e7ff] bg-white px-0.5 sm:h-8">
              <Image src={item.src} alt={item.title} width={44} height={28} unoptimized className="max-h-5 w-auto max-w-full object-contain sm:max-h-6" />
            </dd>
          ))}
        </dl>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <button className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#ffcf32] px-4 text-sm font-black text-[#1f2a44] transition hover:bg-[#ffd94f]" type="button" onClick={() => void addToCart()}>
          <ShoppingCart size={17} />
          Add To Cart
        </button>
        <button
          type="button"
          onClick={async () => {
            if (await addToCart()) {
              window.location.href = "/checkout";
            }
          }}
          className="inline-flex h-12 items-center justify-center rounded-md bg-[#e60012] px-4 text-sm font-black text-white hover:bg-[#c90000]"
        >
          Buy Now
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Link href="/help" className="inline-flex items-center justify-center gap-2 rounded-md border border-[#d9e7ff] bg-white px-3 py-2 text-sm font-semibold text-[#667085] hover:border-[#e60012] hover:text-[#e60012]">
          <MessageCircle size={16} /> Enquiry
        </Link>
        <Link href="/shipping-calculator" className="inline-flex items-center justify-center gap-2 rounded-md border border-[#d9e7ff] bg-white px-3 py-2 text-sm font-semibold text-[#667085] hover:border-[#e60012] hover:text-[#e60012]">
          <Truck size={16} /> Freight
        </Link>
        <button className="inline-flex items-center justify-center gap-2 rounded-md border border-[#d9e7ff] bg-white px-3 py-2 text-sm font-semibold text-[#667085] hover:border-[#e60012] hover:text-[#e60012]" type="button">
          <Heart size={16} /> Favorite
        </button>
      </div>
    </div>
  );
}

export function AgentStepGuide() {
  return (
    <div className="guide-agent-steps mt-4 rounded-[16px] bg-[#f3f7fb] p-3">
      <div className="grid gap-2 text-xs font-bold text-[#667085] sm:grid-cols-3">
        {["Submit item", "Warehouse check", "Ship parcel"].map((step, index) => (
          <div key={step} className="flex items-center gap-2 rounded-[12px] bg-white px-3 py-2">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#e60012] text-white">{index + 1}</span>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
