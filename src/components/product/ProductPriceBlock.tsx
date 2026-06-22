"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import { calculateDisplayedProductPrice, type PricingSettings } from "@/lib/pricing";

export function ProductPriceBlock({
  priceCny,
  pricingSettings
}: {
  priceCny: number;
  pricingSettings: PricingSettings;
}) {
  const [open, setOpen] = useState(false);
  const [editedPrice, setEditedPrice] = useState("");
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const { convertCny, selectedCurrency } = useCurrency();
  const displayedCny = Number(editedPrice) > 0 ? Number(editedPrice) : priceCny;
  const displayedPrice = calculateDisplayedProductPrice(displayedCny, pricingSettings);

  return (
    <>
      <div className="goods-price mt-5 rounded-[18px] bg-[#fff8ec] p-5 ring-1 ring-[#ffd9a3]">
        <section className="edit-content" id="step1-goods-price">
          <div className="goods-price-tool clearfix">
            <div className="price-content flex flex-wrap items-end gap-x-3 gap-y-1" translate="no">
              <span className="inline-flex items-baseline text-[#e60012]">
                <span className="appr align-top text-xl font-black">≈</span>
                <i className="goods-rmb not-italic text-xl font-black">{selectedCurrency}</i>
                <strong className="goods-txt text-[34px] font-black leading-none">
                  {convertCny(displayedPrice.priceCny).toLocaleString("en-US", {
                    minimumFractionDigits: selectedCurrency === "JPY" || selectedCurrency === "KRW" ? 0 : 2,
                    maximumFractionDigits: selectedCurrency === "JPY" || selectedCurrency === "KRW" ? 0 : 2
                  })}
                </strong>
              </span>
              <span className="foreign-currency pb-1 text-sm font-bold text-[#667085]">
                CN ￥<span>{displayedPrice.priceCny.toFixed(2)}</span>
              </span>
              {pricingSettings.serviceFeeEnabled ? (
                <span className="mb-1 rounded bg-white/85 px-2 py-1 text-xs font-bold text-[#667085]">
                  Incl. {(pricingSettings.serviceFeeRate * 100).toFixed(0)}% service fee
                </span>
              ) : null}
            </div>
            <div className="price-operation mt-3 text-sm text-[#667085]">
              <div>
                <span className="goods-edit-message">Price doesn&apos;t match?</span>
                <button type="button" className="goods-edit ml-2 font-bold text-[#e60012]" onClick={() => setOpen(true)}>
                  Edit Price
                </button>
                <em className="qem ml-1">?</em>
              </div>
              <div className="guide-freight mt-1 text-xs text-[#a39ba6]">Excluding&nbsp;International&nbsp;Shipping&nbsp;Fee</div>
            </div>
          </div>
        </section>
        <p className="qem mt-3 text-xs text-[#b7791f]">Orders paid between 18:00-09:00 (BT) will be processed by 14:00 next day</p>
      </div>

      {open ? (
        <div className="ant-modal-root fixed inset-0 z-50 grid place-items-center bg-slate-900/45 px-4">
          <div className="ant-modal-content relative w-full max-w-[560px] rounded-md bg-white shadow-2xl">
            <button type="button" aria-label="Close" className="ant-modal-close absolute right-4 top-4 text-[#a39ba6] hover:text-[#667085]" onClick={() => setOpen(false)}>
              <span className="ant-modal-close-x">
                <X className="ant-modal-close-icon" size={20} />
              </span>
            </button>
            <div className="ant-modal-header border-b border-[#d9e7ff] px-6 py-4">
              <div className="ant-modal-title text-lg font-black text-[#111827]" id="rcDialogTitle0">Price Change</div>
            </div>
            <div className="ant-modal-body px-6 py-5">
              <section className="user-edit-price space-y-4">
                <div className="input-price">
                  <div className="price-title font-bold text-[#111827]">Product Price</div>
                  <p className="goods-edit-label mt-1 text-sm text-[#667085]">Please enter the final price (no less than 0.01 CNY).</p>
                  <div className="price-input-content mt-3 flex h-11 items-center rounded-md border border-[#d9e7ff] bg-white px-3">
                    <span className="rmb-symbol mr-2 text-sm font-bold text-[#667085]">CN ￥</span>
                    <input type="number" min="0.01" step="0.01" className="ant-input min-w-0 flex-1 border-0 text-sm outline-none" value={editedPrice} onChange={(event) => setEditedPrice(event.target.value)} />
                  </div>
                </div>
                <p className="reason-title text-sm font-bold text-[#111827]"><i className="dot mr-1 text-[#ff4d4f]">*</i>Modification reasons: </p>
                <div className="goods-reasons space-y-3">
                  <div className="goods-reasons-main">
                    <select className="ant-select ant-select-enabled h-11 w-full rounded-md border border-[#d9e7ff] bg-white px-3 text-sm outline-none focus:border-[#e60012]" value={reason} onChange={(event) => setReason(event.target.value)}>
                      <option value="">Please choose the reason for modifying the price</option>
                      <option value="seller-discount">Seller discount or coupon</option>
                      <option value="price-change">Source platform price changed</option>
                      <option value="manual-confirmation">Manual confirmation with seller</option>
                    </select>
                  </div>
                  <div className="goods-reasons-bottom clearfix relative">
                    <em className="absolute left-3 top-3 text-[#ff4d4f]">*</em>
                    <textarea
                      maxLength={200}
                      placeholder="Please fill in the specific reasons, so that the seller can confirm during the purchase."
                      className="min-h-[92px] w-full rounded-md border border-[#d9e7ff] px-7 py-3 text-sm outline-none focus:border-[#e60012]"
                      value={detail}
                      onChange={(event) => setDetail(event.target.value)}
                    />
                    <i className="length-text absolute bottom-3 right-3 text-xs not-italic text-[#a39ba6]">{detail.length}/200</i>
                  </div>
                </div>
              </section>
            </div>
            <div className="ant-modal-footer border-t border-[#d9e7ff] px-6 py-4">
              <div className="flex justify-end gap-2">
                <button type="button" className="ant-btn h-10 rounded-md border border-[#d9e7ff] bg-white px-4 text-sm font-bold text-[#667085]" onClick={() => setOpen(false)}>
                  <span>Cancel</span>
                </button>
                <button type="button" className="ant-btn ant-btn-primary h-10 rounded-md bg-[#e60012] px-4 text-sm font-bold text-white" onClick={() => setOpen(false)}>
                  <span>OK</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
