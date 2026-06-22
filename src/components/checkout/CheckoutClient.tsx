"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronDown, MapPin, PackageCheck, PackagePlus, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import { AddressRegionFields } from "@/components/forms/AddressRegionFields";
import { MobileBusinessStepFlow } from "@/components/mobile/business/MobileBusinessStepFlow";
import { MobileSectionShell } from "@/components/mobile/layout/MobileSectionShell";
import {
  cartSnapshot,
  cartUpsellSnapshot,
  parseCartSnapshot,
  parseCartUpsellSnapshot,
  readCart,
  subscribeToCart,
  summarizeCart,
  writeCartUpsells
} from "@/lib/cart-store";
import type { CartUpsellSelection } from "@/lib/cart-store";
import type { CartValueAddedService } from "@/lib/value-added-services";
import { getSeoLocaleByAppLocale } from "../../../config/i18n";

type CheckoutAddress = {
  id: number;
  label: string;
  contactName: string;
  phone: string;
  country: string;
  state?: string | null;
  city: string;
  postalCode: string;
  line1: string;
  line2?: string | null;
  isDefault: boolean;
};

type AddressMode = "saved" | "edit" | "new";

const emptyAddress: CheckoutAddress = {
  id: 0,
  label: "Shipping",
  contactName: "",
  phone: "",
  country: "US",
  state: "",
  city: "",
  postalCode: "",
  line1: "",
  line2: "",
  isDefault: true
};

export function CheckoutClient({
  addresses = [],
  userEmail,
  valueAddedServices = []
}: {
  addresses?: CheckoutAddress[];
  userEmail?: string;
  valueAddedServices?: CartValueAddedService[];
}) {
  const locale = useLocale();
  const publicLocale = getSeoLocaleByAppLocale(locale) ?? locale;
  const t = useTranslations("CheckoutPage");
  const snapshot = useSyncExternalStore(subscribeToCart, cartSnapshot, () => "[]");
  const upsellSnapshot = useSyncExternalStore(subscribeToCart, cartUpsellSnapshot, () => "[]");
  const items = useMemo(() => parseCartSnapshot(snapshot), [snapshot]);
  const serviceIdSet = useMemo(() => new Set(valueAddedServices.map((service) => service.id)), [valueAddedServices]);
  const selectedUpsells = useMemo(
    () => parseCartUpsellSnapshot(upsellSnapshot).filter((service) => serviceIdSet.has(service.serviceId)),
    [serviceIdSet, upsellSnapshot]
  );
  const totals = useMemo(() => summarizeCart(items, selectedUpsells), [items, selectedUpsells]);
  const { formatUsd } = useCurrency();
  const [savedAddresses, setSavedAddresses] = useState(addresses);
  const [selectedAddressId, setSelectedAddressId] = useState(addresses.find((address) => address.isDefault)?.id ?? addresses[0]?.id ?? 0);
  const [addressMode, setAddressMode] = useState<AddressMode>(addresses.length ? "saved" : "new");
  const [draftAddress, setDraftAddress] = useState<CheckoutAddress>(() => addresses.find((address) => address.id === selectedAddressId) ?? emptyAddress);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [userNote, setUserNote] = useState("");
  const [expandedServiceId, setExpandedServiceId] = useState<number | null>(null);
  const selectedAddress = savedAddresses.find((address) => address.id === selectedAddressId);
  const addressLimitReached = savedAddresses.length >= 3;

  function findUpsell(serviceId: number) {
    return selectedUpsells.find((service) => service.serviceId === serviceId);
  }

  function toggleUpsell(service: CartValueAddedService) {
    const selected = findUpsell(service.id);
    const nextUpsells = selected
      ? selectedUpsells.filter((item) => item.serviceId !== service.id)
      : [
          ...selectedUpsells,
          {
            serviceId: service.id,
            code: service.code,
            name: service.name,
            chargeStandard: service.chargeStandard,
            priceUsd: service.priceUsd,
            priceMode: service.priceMode,
            quantity: 1
          }
        ];
    writeCartUpsells(nextUpsells);
    setExpandedServiceId((current) => {
      if (selected) {
        return current === service.id ? null : current;
      }
      return service.id;
    });
  }

  function updateUpsell(serviceId: number, patch: Partial<CartUpsellSelection>) {
    writeCartUpsells(
      selectedUpsells.map((service) =>
        service.serviceId === serviceId
          ? { ...service, ...patch, quantity: Math.max(1, Number(patch.quantity ?? service.quantity) || 1) }
          : service
      )
    );
  }

  function toggleServiceDetails(serviceId: number) {
    setExpandedServiceId((current) => (current === serviceId ? null : serviceId));
  }

  if (!items.length) {
    return (
      <>
        <MobileSectionShell title={t("breadcrumbs.payment")} description={t("empty.description")} kicker={t("breadcrumbs.information")} showBottomSpacing={false} className="md:hidden" showBackButton>
          <section className="card-stack-section">
            <div className="mobile-checkout-empty">
              <h2>{t("empty.title")}</h2>
              <p>{t("empty.description")}</p>
              <Link href={`/${publicLocale}/search`} className="cnsnap-home-mobile-more">{t("empty.action")}</Link>
            </div>
          </section>
        </MobileSectionShell>
        <div className="mx-auto hidden min-h-[100dvh] max-w-2xl place-items-center px-4 py-10 md:grid">
          <section className="w-full rounded-[28px] border border-[#d9e7ff] bg-white p-8 text-center shadow-[0_18px_45px_rgba(10,131,255,0.08)]">
            <Link href="/" className="mx-auto inline-flex items-center" aria-label="CNSnap home">
              <Image
                src="/brand/cnsnap-logo.svg"
                alt="CNSnap"
                width={1540}
                height={453}
                priority
                className="h-[42px] w-auto"
              />
            </Link>
            <PackageCheck className="mx-auto mt-8 text-[#e60012]" size={36} />
            <h1 className="mt-4 text-3xl font-black tracking-tight text-[#111827]">{t("empty.title")}</h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#667085]">{t("empty.description")}</p>
            <Link href={`/${publicLocale}/search`} className="btn-primary mt-6">{t("empty.action")}</Link>
          </section>
        </div>
      </>
    );
  }

  return (
    <>
      <MobileSectionShell
        title={t("breadcrumbs.payment")}
        description={t("shippingNotice")}
        kicker={t("breadcrumbs.information")}
        showBottomSpacing={false}
        className="mobile-checkout-page md:hidden"
        showBackButton
      >
        <section className="card-stack-section">
          <MobileBusinessStepFlow
            steps={[
              {
                key: "cart",
                label: t("breadcrumbs.cart"),
                description: t("empty.action"),
                status: "complete"
              },
              {
                key: "information",
                label: t("breadcrumbs.information"),
                description: t("panels.delivery"),
                status: "current"
              },
              {
                key: "payment",
                label: t("breadcrumbs.payment"),
                description: t("shippingNotice"),
                status: "upcoming"
              }
            ]}
          />
        </section>
        <section className="card-stack-section">
          <div className="mobile-checkout-card p-4">
            <div className="text-[11px] font-black uppercase tracking-[0.12em] text-[#98a2b3]">{t("panels.contact")}</div>
            <div className="mt-2 rounded-2xl border border-[#e8dce2] bg-[#fffafd] px-4 py-3 text-sm font-bold text-[#111827]">
              {userEmail ?? t("guestEmail")}
            </div>
          </div>
        </section>

        <section className="card-stack-section">
          <div className="mobile-checkout-card p-4">
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-[#98a2b3]">{t("panels.delivery")}</div>
            <div className="grid gap-3">
              {savedAddresses.length ? (
                savedAddresses.map((address) => {
                  const active = selectedAddressId === address.id && addressMode === "saved";
                  return (
                    <label key={address.id} className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${active ? "border-[#e60012] bg-[#f7fbff] ring-2 ring-[#e60012]/10" : "border-[#d9e7ff] bg-white"}`}>
                      <input
                        type="radio"
                        name="savedAddressMobile"
                        checked={selectedAddressId === address.id && addressMode === "saved"}
                        onChange={() => {
                          setSelectedAddressId(address.id);
                          setAddressMode("saved");
                          setDraftAddress(address);
                        }}
                        className="mt-1"
                      />
                      <AddressPreview address={address} />
                    </label>
                  );
                })
              ) : null}
              <div className="grid gap-2 sm:grid-cols-2">
                {selectedAddress ? (
                  <button
                    type="button"
                    className="btn-secondary rounded-xl px-4 py-2 text-xs"
                    onClick={() => {
                      setDraftAddress(selectedAddress);
                      setAddressMode("edit");
                    }}
                  >
                    <Pencil size={14} />
                    {t("actions.edit")}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn-secondary rounded-xl px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={addressLimitReached}
                  onClick={() => {
                    if (addressLimitReached) {
                      setError(t("errors.addressLimit"));
                      return;
                    }
                    setDraftAddress({ ...emptyAddress, isDefault: !savedAddresses.length });
                    setAddressMode("new");
                  }}
                >
                  <Plus size={14} />
                  {t("actions.addAddress")}
                </button>
              </div>
              {addressMode !== "saved" ? (
                <AddressForm
                  mode={addressMode}
                  address={draftAddress}
                  onChange={setDraftAddress}
                  onCancel={savedAddresses.length ? () => setAddressMode("saved") : undefined}
                />
              ) : null}
            </div>
          </div>
        </section>

        {valueAddedServices.length ? (
          <section className="card-stack-section">
            <div className="mobile-checkout-card p-4">
              <div className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-[#98a2b3]">{t("panels.valueAdded")}</div>
              <div className="grid gap-2">
                {valueAddedServices.map((service) => {
                  const selected = findUpsell(service.id);
                  const expanded = expandedServiceId === service.id;
                  return (
                    <article
                      key={service.id}
                      className={`rounded-[18px] border p-3 transition ${
                        selected ? "border-[#e60012] bg-[#fff7f8]" : "border-[#d9e7ff] bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <label className="flex shrink-0 cursor-pointer items-start pt-0.5">
                          <input
                            type="checkbox"
                            className="size-4 accent-[#e60012]"
                            checked={Boolean(selected)}
                            onChange={() => toggleUpsell(service)}
                          />
                        </label>
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => toggleServiceDetails(service.id)}
                            aria-expanded={expanded}
                            className="flex w-full items-start justify-between gap-3 text-left"
                          >
                            <span className="min-w-0">
                              <span className="block text-sm font-black leading-5 text-[#111827]">{service.name}</span>
                              {selected ? (
                                <span className="mt-1 inline-flex rounded-full bg-[#fff1f2] px-1.5 py-0.5 text-[10px] font-black text-[#e60012]">
                                  x{selected.quantity}
                                </span>
                              ) : null}
                            </span>
                            <ChevronDown size={14} className={`mt-0.5 text-[#98a2b3] transition ${expanded ? "rotate-180" : ""}`} />
                          </button>
                          {expanded ? (
                            <div className="mt-2.5 grid gap-2 border-t border-[#f4d4da] pt-2.5">
                              <p className="text-[11px] font-semibold leading-4.5 text-[#667085]">{service.description}</p>
                              {selected ? (
                                <div className="grid gap-2">
                                  <label className="grid gap-1 text-[11px] font-black text-[#667085]">
                                    {t("actions.quantity")}
                                    <input
                                      type="number"
                                      min={1}
                                      value={selected.quantity}
                                      onChange={(event) => updateUpsell(service.id, { quantity: Number(event.target.value) })}
                                      className="input h-10 rounded-xl px-3 py-1.5 text-sm"
                                    />
                                  </label>
                                  <label className="grid gap-1 text-[11px] font-black text-[#667085]">
                                    {t("actions.serviceNote")}
                                    <input
                                      value={selected.note ?? ""}
                                      onChange={(event) => updateUpsell(service.id, { note: event.target.value })}
                                      placeholder={t("valueAdded.notePlaceholder")}
                                      className="input h-10 rounded-xl px-3 py-1.5 text-sm"
                                    />
                                  </label>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        <section className="card-stack-section">
          <div className="mobile-checkout-card p-4">
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-[#98a2b3]">{t("panels.notes")}</div>
            <textarea
              name="userNote"
              className="input min-h-28 rounded-xl"
              placeholder={t("notesPlaceholder")}
              value={userNote}
              onChange={(event) => setUserNote(event.target.value)}
            />
          </div>
        </section>

        <section className="card-stack-section">
          <div className="mobile-checkout-card p-4">
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-[#98a2b3]">{t("summary.title")}</div>
            <OrderSummary items={items} selectedUpsells={selectedUpsells} totals={totals} formatUsd={formatUsd} compact />
          </div>
        </section>

        {error ? (
          <section className="card-stack-section">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>
          </section>
        ) : null}

        <div className="mobile-checkout-summary-bar">
          <div className="mobile-checkout-summary-bar-inner">
            <div className="mobile-checkout-summary-copy">
              <span>{t("summary.total")}</span>
              <strong>{formatUsd(totals.total)}</strong>
            </div>
            <button
              type="button"
              className="mobile-checkout-submit-btn"
              disabled={!items.length || submitting}
              onClick={submitMobileCheckout}
            >
              {submitting ? t("actions.submitting") : t("actions.submitOrder")}
            </button>
          </div>
        </div>
      </MobileSectionShell>

      <div className="hidden min-h-[100dvh] bg-white md:block">
        <div className="mx-auto grid max-w-[1180px] lg:grid-cols-[minmax(0,660px)_minmax(360px,1fr)]">
        <section className="px-4 py-8 sm:px-8 lg:min-h-[100dvh] lg:border-r lg:border-[#eadfe4] lg:py-10">
          <Link href="/" className="inline-flex items-center" aria-label="CNSnap home">
            <Image
              src="/brand/cnsnap-logo.svg"
              alt="CNSnap"
              width={1540}
              height={453}
              priority
              className="h-[42px] w-auto"
            />
          </Link>
          <nav className="mt-5 flex flex-wrap items-center gap-2 text-xs font-black text-[#9b92a0]">
            <Link href={`/${publicLocale}/cart`} className="text-[#e60012]">{t("breadcrumbs.cart")}</Link>
            <span>/</span>
            <span className="text-[#111827]">{t("breadcrumbs.information")}</span>
            <span>/</span>
            <span>{t("breadcrumbs.payment")}</span>
          </nav>

          <form onSubmit={submitCheckout} data-checkout-form="true" className="mt-8 space-y-7">
            <CheckoutPanel
              title={t("panels.contact")}
              action={userEmail ? <Link href="/account" className="text-xs font-black text-[#e60012]">{t("actions.account")}</Link> : <Link href="/login" className="text-xs font-black text-[#e60012]">{t("actions.login")}</Link>}
            >
              <div className="rounded-xl border border-[#e8dce2] bg-[#fffafd] px-4 py-3 text-sm font-bold text-[#111827]">
                {userEmail ?? t("guestEmail")}
              </div>
            </CheckoutPanel>

            <CheckoutPanel title={t("panels.delivery")}>
              {savedAddresses.length ? (
                <div className="grid gap-3">
                  {savedAddresses.map((address) => {
                    const active = selectedAddressId === address.id && addressMode === "saved";
                    return (
                      <label key={address.id} className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${active ? "border-[#e60012] bg-[#f7fbff] ring-2 ring-[#e60012]/10" : "border-[#d9e7ff] bg-white hover:border-[#ff9bbd]"}`}>
                        <input
                          type="radio"
                          name="savedAddress"
                          checked={selectedAddressId === address.id && addressMode === "saved"}
                          onChange={() => {
                            setSelectedAddressId(address.id);
                            setAddressMode("saved");
                            setDraftAddress(address);
                          }}
                          className="mt-1"
                        />
                        <AddressPreview address={address} />
                        <button
                          type="button"
                          className="self-start rounded-full p-2 text-[#98a2b3] transition hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete address ${address.label}`}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            void deleteAddress(address.id);
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </label>
                    );
                  })}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {selectedAddress ? (
                  <button
                    type="button"
                    className="btn-secondary rounded-xl px-4 py-2 text-xs"
                    onClick={() => {
                      setDraftAddress(selectedAddress);
                      setAddressMode("edit");
                    }}
                  >
                    <Pencil size={14} />
                    {t("actions.edit")}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn-secondary rounded-xl px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={addressLimitReached}
                  onClick={() => {
                    if (addressLimitReached) {
                      setError(t("errors.addressLimit"));
                      return;
                    }
                    setDraftAddress({ ...emptyAddress, isDefault: !savedAddresses.length });
                    setAddressMode("new");
                  }}
                  >
                    <Plus size={14} />
                    {t("actions.addAddress")}
                  </button>
              </div>

              {addressMode !== "saved" ? (
                <AddressForm
                  mode={addressMode}
                  address={draftAddress}
                  onChange={setDraftAddress}
                  onCancel={savedAddresses.length ? () => setAddressMode("saved") : undefined}
                />
              ) : null}
            </CheckoutPanel>

            {valueAddedServices.length ? (
              <CheckoutPanel
                title={t("panels.valueAdded")}
                action={
                  selectedUpsells.length ? (
                    <div className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                      {t("valueAdded.selectedCount", { count: selectedUpsells.length })}
                    </div>
                  ) : null
                }
              >
                <div className="rounded-[24px] border border-[#eadfe4] bg-[#fffafd] p-3 sm:p-4">
                  <div className="mb-3 flex items-start gap-2.5 rounded-[18px] border border-[#f4e7ec] bg-white px-3 py-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-2xl bg-[#fff1f2] text-[#e60012]">
                      <PackagePlus size={16} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-black text-[#111827]">{t("valueAdded.title")}</div>
                      <p className="mt-0.5 text-xs font-semibold leading-5 text-[#667085]">
                        {t("valueAdded.description")}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {valueAddedServices.map((service) => {
                      const selected = findUpsell(service.id);
                      const expanded = expandedServiceId === service.id;
                      return (
                        <article
                          key={service.id}
                          className={`rounded-[18px] border p-3 transition ${
                            selected
                              ? "border-[#e60012] bg-[#fff7f8]"
                              : "border-[#d9e7ff] bg-white hover:border-[#ff9bbd]"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <label className="flex shrink-0 cursor-pointer items-start pt-0.5">
                              <input
                                type="checkbox"
                                className="size-4 accent-[#e60012]"
                                checked={Boolean(selected)}
                                onChange={() => toggleUpsell(service)}
                              />
                            </label>
                            <div className="min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => toggleServiceDetails(service.id)}
                                aria-expanded={expanded}
                                aria-label={`Toggle ${service.name} details`}
                                className="flex w-full items-start justify-between gap-3 text-left"
                              >
                                <span className="min-w-0">
                                  <span className="block text-sm font-black leading-5 text-[#111827]">{service.name}</span>
                                  {selected ? (
                                    <span className="mt-1 inline-flex rounded-full bg-[#fff1f2] px-1.5 py-0.5 text-[10px] font-black text-[#e60012]">
                                      x{selected.quantity}
                                    </span>
                                  ) : null}
                                </span>
                                <span className="flex shrink-0 items-start gap-2 pl-2">
                                  <span className="max-w-[112px] text-right text-[11px] font-black leading-4.5 text-[#667085]">
                                    {service.chargeStandard}
                                  </span>
                                  <ChevronDown
                                    size={14}
                                    className={`mt-0.5 text-[#98a2b3] transition ${expanded ? "rotate-180" : ""}`}
                                  />
                                </span>
                              </button>

                              {expanded ? (
                                <div className="mt-2.5 grid gap-2 border-t border-[#f4d4da] pt-2.5">
                                  <div className="grid gap-1">
                                    <p className="text-[11px] font-semibold leading-4.5 text-[#667085]">{service.description}</p>
                                    {service.applicableRange ? (
                                      <p className="text-[10px] font-bold leading-4 text-[#8a8190]">
                                        {t("valueAdded.applicable")}: {service.applicableRange}
                                      </p>
                                    ) : null}
                                  </div>

                                  {selected ? (
                                    <div className="grid gap-2 sm:grid-cols-[92px_minmax(0,1fr)]">
                                      <label className="grid gap-1 text-[11px] font-black text-[#667085]">
                                        Quantity
                                        <input
                                          type="number"
                                          min={1}
                                          value={selected.quantity}
                                          onChange={(event) => updateUpsell(service.id, { quantity: Number(event.target.value) })}
                                          className="input h-9 rounded-lg px-3 py-1.5 text-sm"
                                        />
                                      </label>
                                      <label className="grid gap-1 text-[11px] font-black text-[#667085]">
                                        Service note
                                        <input
                                          value={selected.note ?? ""}
                                          onChange={(event) => updateUpsell(service.id, { note: event.target.value })}
                                          placeholder={t("valueAdded.notePlaceholder")}
                                          className="input h-9 rounded-lg px-3 py-1.5 text-sm"
                                        />
                                      </label>
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </CheckoutPanel>
            ) : null}

            <CheckoutPanel title={t("panels.notes")}>
              <textarea
                name="userNote"
                className="input min-h-28 rounded-xl"
                placeholder={t("notesPlaceholder")}
                value={userNote}
                onChange={(event) => setUserNote(event.target.value)}
              />
            </CheckoutPanel>

            {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : null}

            <div className="border-t border-[#d9e7ff] pt-6">
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-900">
                {t("shippingNotice")}
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/cart" className="inline-flex items-center gap-2 text-sm font-black text-[#e60012]">
                <ArrowLeft size={16} />
                {t("actions.returnToCart")}
              </Link>
              <button className="btn-primary rounded-xl px-8" disabled={!items.length || submitting}>{submitting ? t("actions.submitting") : t("actions.submitOrder")}</button>
              </div>
            </div>
          </form>
        </section>

        <aside className="bg-[#f7fbff] px-4 py-8 sm:px-8 lg:sticky lg:top-0 lg:h-[100dvh] lg:overflow-y-auto lg:py-10">
          <OrderSummary items={items} selectedUpsells={selectedUpsells} totals={totals} formatUsd={formatUsd} />
        </aside>
      </div>
      </div>
    </>
  );

  async function submitCheckout(
    event?: React.FormEvent<HTMLFormElement>,
    formOverride?: FormData
  ) {
    event?.preventDefault();
    const form = formOverride ?? (event ? new FormData(event.currentTarget) : new FormData());
    setError("");
    setSubmitting(true);

    try {
      let addressId = addressMode === "saved" ? selectedAddressId : 0;
      if (addressMode !== "saved") {
        if (addressMode === "new" && addressLimitReached) {
          throw new Error("You can save up to 3 delivery addresses. Please delete another address first.");
        }
        const payload = {
          ...draftAddress,
          id: addressMode === "edit" && draftAddress.id ? draftAddress.id : undefined
        };
        const response = await fetch("/api/checkout/address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const json = (await response.json()) as { addressId?: number; error?: string };
        if (!response.ok || !json.addressId) throw new Error(json.error || t("errors.saveAddress"));
        addressId = json.addressId;

        const normalizedAddress: CheckoutAddress = {
          ...draftAddress,
          id: addressId
        };

        setSavedAddresses((current) => {
          const withoutCurrent = current.filter((address) => address.id !== addressId);
          const next = [...withoutCurrent, normalizedAddress].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
          return normalizedAddress.isDefault
            ? next.map((address) => ({ ...address, isDefault: address.id === addressId }))
            : next;
        });
        setSelectedAddressId(addressId);
        setDraftAddress(normalizedAddress);
        setAddressMode("saved");
      }

      form.set(
        "items",
        JSON.stringify(
          items.map(({ productId, product, skuId, skuText, quantity, chinaFreight }) => ({
            productId,
            platform: product.platform,
            sourceItemId: product.sourceItemId,
            skuId,
            skuText,
            quantity,
            chinaFreight: Number(chinaFreight) || 0
          }))
        )
      );
      if (addressId) form.set("addressId", String(addressId));
      form.set("valueAddedServices", JSON.stringify(selectedUpsells));
      if (!form.has("userNote")) {
        form.set("userNote", userNote);
      }

      const response = await fetch("/api/orders", { method: "POST", body: form });
      if (response.redirected) {
        window.location.href = response.url;
        return;
      }
      const json = await response.json().catch(() => ({})) as { error?: string; id?: number };
      if (!response.ok) throw new Error(json.error || t("errors.createOrder"));
      window.location.href = `/${publicLocale}/checkout?order=${json.id}`;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("errors.checkoutFailed"));
      setSubmitting(false);
    }
  }

  async function submitMobileCheckout() {
    const form = new FormData();
    form.set("userNote", userNote);
    await submitCheckout(undefined, form);
  }

  async function deleteAddress(addressId: number) {
    if (!window.confirm(t("confirmDeleteAddress"))) return;
    setError("");
    const response = await fetch(`/api/checkout/address?id=${addressId}`, { method: "DELETE" });
    const json = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) {
      setError(json.error || t("errors.deleteAddress"));
      return;
    }
    const nextAddresses = savedAddresses.filter((address) => address.id !== addressId);
    setSavedAddresses(nextAddresses);
    if (selectedAddressId === addressId) {
      const nextSelected = nextAddresses.find((address) => address.isDefault) ?? nextAddresses[0];
      setSelectedAddressId(nextSelected?.id ?? 0);
      setDraftAddress(nextSelected ?? emptyAddress);
      setAddressMode(nextSelected ? "saved" : "new");
    }
  }
}

function CheckoutPanel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xl font-black text-[#111827]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function AddressPreview({ address }: { address: CheckoutAddress }) {
  return (
    <div className="min-w-0 flex-1 text-sm">
      <div className="flex flex-wrap items-center gap-2 font-black text-[#111827]">
        <MapPin size={16} className="text-[#e60012]" />
        {address.contactName}
        {address.isDefault ? <span className="rounded-full bg-[#fff1f2] px-2 py-0.5 text-[11px] text-[#e60012]">Default</span> : null}
      </div>
      <p className="mt-2 font-semibold leading-6 text-[#667085]">
        {address.phone} · {address.line1}{address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state ? `${address.state}, ` : ""}{address.postalCode}, {address.country}
      </p>
      <p className="mt-1 text-xs font-bold text-[#9b92a0]">{address.label}</p>
    </div>
  );
}

function AddressForm({
  mode,
  address,
  onChange,
  onCancel
}: {
  mode: AddressMode;
  address: CheckoutAddress;
  onChange: (address: CheckoutAddress) => void;
  onCancel?: () => void;
}) {
  function setField<K extends keyof CheckoutAddress>(key: K, value: CheckoutAddress[K]) {
    onChange({ ...address, [key]: value });
  }
  const t = useTranslations("CheckoutPage");

  return (
    <section className="mt-4 rounded-2xl border border-[#d9e7ff] bg-[#fffafd] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-black text-[#111827]">{mode === "new" ? t("addressForm.addTitle") : t("addressForm.editTitle")}</h3>
        {onCancel ? <button type="button" className="text-xs font-black text-[#e60012]" onClick={onCancel}>{t("addressForm.useSaved")}</button> : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label={t("addressForm.label")} value={address.label} onChange={(value) => setField("label", value)} />
        <TextField label={t("addressForm.contactName")} value={address.contactName} onChange={(value) => setField("contactName", value)} required />
        <TextField label={t("addressForm.phone")} value={address.phone} onChange={(value) => setField("phone", value)} required />
        <AddressRegionFields
          defaultCountry={address.country}
          defaultState={address.state}
          countryValue={address.country}
          stateValue={address.state ?? ""}
          onCountryChange={(value) => onChange({ ...address, country: value, state: "" })}
          onStateChange={(value) => setField("state", value)}
          countryClassName="input rounded-xl"
          stateClassName="input rounded-xl"
          labelClassName="grid gap-2 text-sm font-black text-[#111827]"
          showLabels
        />
        <TextField label={t("addressForm.city")} value={address.city} onChange={(value) => setField("city", value)} required />
        <TextField label={t("addressForm.postalCode")} value={address.postalCode} onChange={(value) => setField("postalCode", value)} required />
        <TextField label={t("addressForm.line1")} value={address.line1} onChange={(value) => setField("line1", value)} required />
        <TextField label={t("addressForm.line2")} value={address.line2 ?? ""} onChange={(value) => setField("line2", value)} />
        <label className="flex items-center gap-2 rounded-xl border border-[#d9e7ff] bg-white px-4 py-3 text-sm font-bold text-[#667085]">
          <input type="checkbox" checked={address.isDefault} onChange={(event) => setField("isDefault", event.target.checked)} />
          {t("addressForm.default")}
        </label>
      </div>
    </section>
  );
}

function TextField({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-black text-[#111827]">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} required={required} className="input rounded-xl" />
    </label>
  );
}

function OrderSummary({
  items,
  selectedUpsells,
  totals,
  formatUsd,
  compact = false
}: {
  items: ReturnType<typeof readCart>;
  selectedUpsells: ReturnType<typeof parseCartUpsellSnapshot>;
  totals: ReturnType<typeof summarizeCart>;
  formatUsd: (amountUsd: number) => string;
  compact?: boolean;
}) {
  const t = useTranslations("CheckoutPage");

  return (
    <section className="lg:max-w-[430px]">
      {!compact ? (
        <div className="flex items-center gap-2 text-sm font-black text-[#111827]">
          <ShieldCheck size={17} className="text-[#e60012]" />
          {t("summary.secure")}
        </div>
      ) : null}
      <div className={`${compact ? "divide-y divide-[#eadfe4]" : "mt-6 divide-y divide-[#eadfe4]"}`}>
        {items.map((item, index) => (
          <div key={`${item.productId}-${item.skuId ?? "default"}-${index}`} className="flex gap-4 py-4 first:pt-0">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-[#d9e7ff] bg-white">
              <Image src={item.product.mainImage} alt={item.product.title} fill sizes="64px" className="object-cover" />
              <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#667085] text-[10px] font-black text-white">{item.quantity}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 text-sm font-black leading-5 text-[#111827]">{item.product.title}</div>
              <div className="mt-1 text-xs font-semibold text-[#8a8190]">{item.skuText || "Default SKU"}</div>
              <div className="mt-1 text-[11px] font-black uppercase text-[#e60012]">{item.product.platform}</div>
              <div className="mt-1 text-[11px] font-semibold text-[#8a8190]">{t("summary.domesticShipping")}: CNY ¥{(Number(item.chinaFreight) || 0).toFixed(2)}</div>
            </div>
            <div className="whitespace-nowrap text-sm font-black text-[#111827]">{formatUsd(item.product.priceUsd * item.quantity)}</div>
          </div>
        ))}
      </div>

      {selectedUpsells.length ? (
        <div className="mt-5 rounded-2xl border border-[#eadfe4] bg-white p-4">
          <div className="text-xs font-black uppercase text-[#e60012]">{t("summary.valueAddedServices")}</div>
          <div className="mt-3 space-y-3">
            {selectedUpsells.map((service) => (
              <div key={service.serviceId} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-black text-[#111827]">{service.name}</div>
                  <div className="mt-1 text-xs font-semibold text-[#8a8190]">
                    {service.chargeStandard} x {service.quantity}
                  </div>
                  {service.note ? <div className="mt-1 line-clamp-2 text-xs font-semibold text-[#8a8190]">{service.note}</div> : null}
                </div>
                <div className="whitespace-nowrap font-black text-[#111827]">{formatUsd(service.priceUsd * service.quantity)}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <dl className="mt-5 space-y-3 border-t border-[#eadfe4] pt-5 text-sm">
        <SummaryRow label={t("summary.subtotal")} value={formatUsd(totals.subtotalUsd)} />
        <SummaryRow label={t("summary.domesticShipping")} value={formatUsd(totals.domesticShippingUsd)} />
        <SummaryRow label={t("summary.serviceFee")} value={formatUsd(totals.serviceFee)} />
        <SummaryRow label={t("summary.valueAddedServices")} value={formatUsd(totals.upsellUsd)} />
        <SummaryRow label={t("summary.total")} value={formatUsd(totals.total)} strong />
      </dl>
    </section>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${strong ? "border-t border-[#eadfe4] pt-4 text-lg" : ""}`}>
      <dt className="font-semibold text-[#667085]">{label}</dt>
      <dd className={`font-black ${strong ? "text-2xl text-[#111827]" : "text-[#111827]"}`}>{value}</dd>
    </div>
  );
}
