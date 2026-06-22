"use client";

import * as React from "react";
import Link from "next/link";
import { MobileAccountListToolbar } from "@/components/account/mobile/MobileAccountListToolbar";

type ShippingCoupon = {
  id: string;
  discount: string;
  validUntil: string;
  minimumShippingFee: string;
  applicableCountries: string;
  applicableChannels: string;
};

type ServiceDiscount = {
  id: string;
  discount: string;
};

type DiscountOrder = {
  id: string;
  orderNo: string;
  totalUsd: number;
  href: string;
};

export function MobileCouponsWorkspace({
  title,
  description,
  shippingCoupons,
  serviceDiscounts,
  discountedOrders,
  shippingCouponsLabel,
  serviceOffersLabel,
  discountReadyOrdersLabel,
  discountReadyOrderTag,
  emptyTitle
}: {
  title: string;
  description: string;
  shippingCoupons: ShippingCoupon[];
  serviceDiscounts: ServiceDiscount[];
  discountedOrders: DiscountOrder[];
  shippingCouponsLabel: string;
  serviceOffersLabel: string;
  discountReadyOrdersLabel: string;
  discountReadyOrderTag: string;
  emptyTitle: string;
}) {
  const [query, setQuery] = React.useState("");
  const [section, setSection] = React.useState("shipping");

  const filterOptions = [
    { label: shippingCouponsLabel, value: "shipping" },
    { label: serviceOffersLabel, value: "service" },
    { label: discountReadyOrdersLabel, value: "orders" }
  ];

  const keyword = query.trim().toLowerCase();

  return (
    <>
      <MobileAccountListToolbar
        searchValue={query}
        searchPlaceholder={title}
        onSearchChange={setQuery}
        filterValue={section}
        onFilterChange={setSection}
        filterOptions={filterOptions}
        filterAriaLabel={title}
      />
      <div className="mt-3">
        {section === "shipping" ? (
          <div className="mobile-account-list">
            {shippingCoupons.filter((coupon) => {
              const haystack = `${coupon.discount} ${coupon.minimumShippingFee} ${coupon.applicableCountries} ${coupon.applicableChannels}`.toLowerCase();
              return !keyword || haystack.includes(keyword);
            }).map((coupon) => (
              <article key={coupon.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-black text-slate-950">{coupon.discount}</div>
                  <span className="rounded-full bg-[#fff3f5] px-2.5 py-1 text-[11px] font-black text-[#d9142f]">{coupon.validUntil}</span>
                </div>
                <div className="mt-2 text-xs leading-5 text-slate-500">{coupon.minimumShippingFee} · {coupon.applicableCountries}</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">{coupon.applicableChannels}</div>
              </article>
            ))}
          </div>
        ) : null}
        {section === "service" ? (
          <div className="mobile-account-list">
            {serviceDiscounts.filter((discount) => {
              const haystack = `${discount.id} ${discount.discount}`.toLowerCase();
              return !keyword || haystack.includes(keyword);
            }).map((discount) => (
              <article key={discount.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-black text-slate-950">{discount.id}</div>
                  <span className="rounded-full bg-[#f7fbff] px-2.5 py-1 text-[11px] font-black text-[#0a83ff]">{discount.discount}</span>
                </div>
              </article>
            ))}
          </div>
        ) : null}
        {section === "orders" ? (
          <div className="mobile-account-list">
            {discountedOrders.filter((order) => {
              const haystack = `${order.orderNo} ${order.totalUsd}`.toLowerCase();
              return !keyword || haystack.includes(keyword);
            }).length ? discountedOrders.filter((order) => {
              const haystack = `${order.orderNo} ${order.totalUsd}`.toLowerCase();
              return !keyword || haystack.includes(keyword);
            }).map((order) => (
              <Link key={order.id} href={order.href} className="mobile-account-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{discountReadyOrderTag}</div>
                    <div className="mt-2 text-base font-black text-slate-950">{order.orderNo}</div>
                  </div>
                  <div className="text-sm font-black text-slate-950">${order.totalUsd.toFixed(2)}</div>
                </div>
              </Link>
            )) : (
              <div className="mobile-cart-empty">
                <h2>{emptyTitle}</h2>
                <p>{description}</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </>
  );
}
