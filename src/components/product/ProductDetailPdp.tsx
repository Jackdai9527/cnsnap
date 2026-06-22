"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Info,
  ExternalLink,
  Minus,
  PackageCheck,
  Plus,
  Share2,
  ShieldAlert,
  ShoppingCart,
  Store
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useCurrency } from "@/components/currency/CurrencyProvider";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { ProductMemory } from "@/components/product/ProductMemory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { addCartItem } from "@/lib/cart-store";
import { formatProductMoney, resolveProductPriceDisplay } from "@/lib/product-price-display";
import { buildBuyUrl } from "@/lib/source-url";
import { cn } from "@/lib/utils";
import type { ProductDetail, ProductSkuDetail } from "@/types/product-detail";
import { getSeoLocaleByAppLocale } from "../../../config/i18n";

const pdpFormSchema = z.object({
  variants: z.record(z.string(), z.string()),
  quantity: z.number().int().min(1).max(999)
});

type PdpFormValues = z.infer<typeof pdpFormSchema>;

type ProductDetailPdpProps = {
  product: ProductDetail;
};

const emptyVariants: Record<string, string> = {};

export function ProductDetailPdp({ product }: ProductDetailPdpProps) {
  const locale = useLocale();
  const publicLocale = getSeoLocaleByAppLocale(locale) ?? locale;
  const t = useTranslations("product.common");
  const currency = useCurrency();
  const form = useForm<PdpFormValues>({
    resolver: zodResolver(pdpFormSchema),
    defaultValues: {
      variants: Object.fromEntries(product.variants.map((group) => [group.id, ""])),
      quantity: 1
    },
    mode: "onChange"
  });
  const selectedVariants = useWatch({ control: form.control, name: "variants" }) ?? emptyVariants;
  const quantity = useWatch({ control: form.control, name: "quantity" }) ?? 1;
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [domesticShippingCny, setDomesticShippingCny] = useState(product.domesticShippingCny);
  const selectedSku = useMemo(
    () => findSelectedSku(product.skus, selectedVariants),
    [product.skus, selectedVariants]
  );
  const selectionComplete = product.variants.every((group) => Boolean(selectedVariants[group.id]));
  const canPurchase = Boolean(selectionComplete && selectedSku && selectedSku.stock > 0);
  const canSubmitPurchase = canPurchase && disclaimerAccepted;
  const currentPriceCny = selectedSku?.priceCny ?? product.priceCny;
  const currentPriceUsd = selectedSku?.priceUsd ?? product.priceUsd;
  const priceDisplay = resolveProductPriceDisplay({
    selectedCurrency: currency.selectedCurrency,
    priceCny: currentPriceCny,
    priceUsd: currentPriceUsd,
    rates: currency.rates
  });
  const stock = selectedSku?.stock ?? 999;
  const selectedVariantSummary = product.variants
    .map((group) => group.options.find((option) => option.id === selectedVariants[group.id])?.label)
    .filter(Boolean)
    .join(" / ");

  function selectVariant(groupId: string, optionId: string, image?: string) {
    form.setValue(`variants.${groupId}`, optionId, { shouldDirty: true, shouldValidate: true });
    if (image) {
      window.dispatchEvent(new CustomEvent("cnsnap:variant-image-change", { detail: { image } }));
    }
  }

  function setQuantity(nextQuantity: number) {
    form.setValue("quantity", Math.min(Math.max(nextQuantity, 1), Math.min(stock || 999, 999)), {
      shouldDirty: true,
      shouldValidate: true
    });
  }

  function addProductToCart() {
    if (!canPurchase || !selectedSku) {
      toast.warning(t("pleaseSelectSkuCart"));
      return;
    }
    if (!disclaimerAccepted) {
      toast.warning(t("pleaseAgreeCart"));
      return;
    }

    addCartItem({
      productId: numericProductId(product.id),
      product: {
        platform: product.sourcePlatform,
        sourceItemId: product.sourceItemId,
        title: product.title,
        mainImage: product.images[0]?.src ?? "/brand/cnsnap-logo.svg",
        priceCny: currentPriceCny,
        priceUsd: currentPriceUsd
      },
      skuId: selectedSku.id,
      skuText: selectedSku.text,
      quantity,
      chinaFreight: domesticShippingCny
    });
    toast.success(t("addedToCart"));
  }

  function buyNow() {
    if (!canPurchase || !selectedSku) {
      toast.warning(t("pleaseSelectSkuCheckout"));
      return;
    }
    if (!disclaimerAccepted) {
      toast.warning(t("pleaseAgreeCheckout"));
      return;
    }

    addProductToCart();
    window.location.href = "/checkout";
  }

  return (
    <main className="brand-page pb-12">
      <Toaster richColors position="top-right" />
      <Form {...form}>
        <div className="mobile-product-topbar md:hidden">
          <button type="button" className="mobile-product-topbar-btn" onClick={() => window.history.back()} aria-label={t("home")}>
            <ArrowLeft size={18} />
          </button>
          <button
            type="button"
            className="mobile-product-topbar-btn"
            onClick={async () => {
              try {
                if (navigator.share) {
                  await navigator.share({ title: product.title, text: product.title, url: product.sourceUrl });
                  return;
                }
                if (navigator.clipboard?.writeText) {
                  await navigator.clipboard.writeText(product.sourceUrl);
                  toast.success(t("shareCopied"));
                  return;
                }
              } catch {
                toast.info(t("shareInfo"));
                return;
              }
              toast.info(t("shareInfo"));
            }}
            aria-label={t("share")}
          >
            <Share2 size={18} />
          </button>
        </div>

        <div className="site-container hidden py-5 text-sm font-semibold text-[#667085] md:block">
          <Link href="/" className="hover:text-[#e60012]">{t("home")}</Link>
          <span className="px-2">/</span>
          <span>{product.category}</span>
        </div>

        <section className="site-container grid gap-5 lg:grid-cols-2">
          <div className="mobile-product-gallery-wrap min-w-0 lg:sticky lg:top-[98px] lg:self-start">
            <ProductImageGallery images={product.images} title={product.title} />
          </div>

          <Card className="mobile-product-buy-panel min-w-0 rounded-[28px] border border-[#d9e7ff] bg-white shadow-[0_16px_40px_rgba(10,131,255,0.08)]">
            <CardContent className="space-y-3.5 p-4 sm:space-y-4 sm:p-4.5">
              <div className="mobile-product-heading space-y-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="border-[#ffd7df] bg-[#fff1f2] px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#e60012]">
                    {product.sourcePlatform.toUpperCase()}
                  </Badge>
                  {product.riskFlags.includes("restricted") ? (
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-black text-amber-800">
                      {t("restrictedReview")}
                    </Badge>
                  ) : null}
                </div>
                <h1 className="text-[30px] font-black leading-[1.12] tracking-[-0.02em] text-[#111827] sm:text-[36px]">
                  {product.title}
                </h1>
                <div className="hidden flex-wrap gap-2 text-sm font-semibold text-[#667085] md:flex mobile-product-store-links">
                  <Link href={product.sourceUrl} target="_blank" className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d9e7ff] bg-[#f7fbff] px-3 hover:border-[#e60012] hover:text-[#e60012]">
                    <ExternalLink size={14} />
                    {t("originalLink")}
                  </Link>
                  {product.sourcePlatform === "weidian" && product.shopUrl ? (
                    <Link
                      href={product.shopUrl}
                      title="Click here to check all products in this shop"
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d9e7ff] bg-white px-3 hover:border-[#0a83ff] hover:text-[#0a83ff]"
                    >
                      <Store size={14} />
                      {t("enterShop")}
                    </Link>
                  ) : null}
                </div>
              </div>

              <PriceBox
                primaryPrice={formatProductMoney(priceDisplay.primaryAmount, priceDisplay.primaryCurrency)}
                secondaryPrice={priceDisplay.secondaryCurrency && priceDisplay.secondaryAmount !== null
                  ? formatProductMoney(priceDisplay.secondaryAmount, priceDisplay.secondaryCurrency)
                  : null}
              />

              <section className="mobile-product-store-card md:hidden">
                <div className="mobile-product-store-card-head">
                  <span className="mobile-product-store-card-title">{product.shopName || t("enterShop")}</span>
                  {product.shopUrl ? (
                    <Link href={product.shopUrl} className="mobile-product-store-card-link">
                      {t("enterShop")}
                    </Link>
                  ) : null}
                </div>
                <p className="mobile-product-store-card-copy">{t("buyingNote")}</p>
              </section>

              <div className="mobile-product-action-row md:hidden">
                <ProductMemory
                  product={{
                    id: product.id,
                    title: product.title,
                    image: product.images[0]?.src ?? "/brand/cnsnap-logo.svg",
                    priceCny: currentPriceCny,
                    sourceUrl: product.sourceUrl,
                    href: buildBuyUrl(product.sourceUrl, publicLocale),
                    platform: product.sourcePlatform,
                    shopName: product.shopName
                  }}
                  iconOnly
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mobile-product-action-chip"
                  aria-label={t("share")}
                  title={t("share")}
                  onClick={async () => {
                    try {
                      if (navigator.share) {
                        await navigator.share({
                          title: product.title,
                          text: product.title,
                          url: product.sourceUrl
                        });
                        return;
                      }

                      if (navigator.clipboard?.writeText) {
                        await navigator.clipboard.writeText(product.sourceUrl);
                        toast.success(t("shareCopied"));
                        return;
                      }
                    } catch {
                      toast.info(t("shareInfo"));
                      return;
                    }

                    toast.info(t("shareInfo"));
                  }}
                >
                  <Share2 size={15} />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="mobile-product-action-chip"
                  aria-label={t("support")}
                  title={t("support")}
                  onClick={() => {
                    window.location.href = `/${publicLocale}/help`;
                  }}
                >
                  <PackageCheck size={15} />
                </Button>
              </div>

                  {product.riskFlags.includes("restricted") ? (
                <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
                  <ShieldAlert className="mt-0.5 shrink-0" size={18} />
                  <p>{t("manualReviewNotice")}</p>
                </div>
              ) : null}

              <VariantSelector
                product={product}
                selectedVariants={selectedVariants}
                onSelect={selectVariant}
                selectedLabel={(value) => t("selected", { value })}
              />

              {selectionComplete && selectedSku ? (
                <div className="mobile-product-selection-summary md:hidden">
                  <div className="mobile-product-selection-summary-title">{t("selected", { value: selectedSku.text })}</div>
                  <div className="mobile-product-selection-summary-meta">
                    <span>{t("quantity")}: {quantity}</span>
                    <span>{t("stockLabel", { count: stock })}</span>
                  </div>
                </div>
              ) : null}

              <div className="space-y-3 border-t border-[#eef2f6] pt-3">
                <QuantityInput
                  value={quantity}
                  max={Math.min(stock || 999, 999)}
                  onChange={setQuantity}
                  label={t("quantity")}
                  maxLabel={t("maxForSku", { count: Math.min(stock || 999, 999) })}
                />

                <PurchaseFlowNotice
                  className="mobile-product-shipping-card"
                  locale={publicLocale}
                  domesticShippingCny={domesticShippingCny}
                  onDomesticShippingChange={setDomesticShippingCny}
                  purchaseWindowLabel={t("purchaseWindow")}
                  sellerLabel={t("sellerLabel")}
                  warehouseLabel={t("warehouseLabel")}
                  addressLabel={t("addressLabel")}
                  domesticLabel={t("domesticLabel")}
                  internationalFreightLabel={t("internationalFreight")}
                  payAfterWeighingLabel={t("payAfterWeighing")}
                />
              </div>

              <div className="space-y-3 border-t border-[#eef2f6] pt-3">
                <PurchaseDisclaimer
                  checked={disclaimerAccepted}
                  onCheckedChange={setDisclaimerAccepted}
                  agreeLabel={t("agree")}
                  disclaimerLabel={t("disclaimer")}
                  disclaimerText={t("disclaimerText")}
                />

                <div className="grid gap-2.5 sm:grid-cols-[1fr_1fr]">
                  <Button
                    type="button"
                    data-mobile-buy-action="cart"
                    className="h-11 rounded-xl bg-[#ffcf32] text-sm font-black text-[#111827] hover:bg-[#ffd94f]"
                    disabled={!canSubmitPurchase}
                    onClick={addProductToCart}
                  >
                    <ShoppingCart size={16} />
                    {t("addToCart")}
                  </Button>
                  <Button
                    type="button"
                    data-mobile-buy-action="buy"
                    className="h-11 rounded-xl bg-[#e60012] text-sm font-black text-white hover:bg-[#c90010]"
                    disabled={!canSubmitPurchase}
                    onClick={buyNow}
                  >
                    {t("buyNow")}
                    <ArrowRight size={16} />
                  </Button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <ProductMemory
                    product={{
                      id: product.id,
                      title: product.title,
                      image: product.images[0]?.src ?? "/brand/cnsnap-logo.svg",
                      priceCny: currentPriceCny,
                      sourceUrl: product.sourceUrl,
                      href: buildBuyUrl(product.sourceUrl, publicLocale),
                      platform: product.sourcePlatform,
                      shopName: product.shopName
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-xl border-[#d9e7ff] bg-white text-[#667085] hover:border-[#0a83ff] hover:bg-[#f7fbff] hover:text-[#0a83ff]"
                    onClick={() => {
                      window.location.href = `/${publicLocale}/diy-order?productName=${encodeURIComponent(product.title)}`;
                    }}
                  >
                    <PackageCheck size={16} />
                    {t("submitDiy")}
                  </Button>
                </div>
              </div>

              {!selectionComplete ? (
                <p className="text-[11px] font-bold leading-5 text-[#e60012]">{t("selectAllVariants")}</p>
              ) : selectedSku && selectedSku.stock <= 0 ? (
                <p className="text-[11px] font-bold leading-5 text-[#e60012]">{t("skuUnavailable")}</p>
              ) : !disclaimerAccepted ? (
                <p className="text-[11px] font-bold leading-5 text-[#e60012]">{t("agreeDisclaimer")}</p>
              ) : null}
            </CardContent>
          </Card>
        </section>

        <section className="site-container mt-6">
          <ProductInfoTabs
            product={product}
            labels={{
              detailsTab: t("detailsTab"),
              specsTab: t("specsTab"),
              shippingTab: t("shippingTab"),
              notesTab: t("notesTab"),
              restrictedTab: t("restrictedTab"),
              faqTab: t("faqTab"),
              shippingNote: t("shippingNote"),
              buyingNote: t("buyingNote"),
              restrictedNote: t("restrictedNote"),
              faqNote: t("faqNote")
            }}
          />
        </section>

      <div className="mobile-product-buy-bar md:hidden">
        <div className="mobile-product-buy-bar-inner">
          <div className="mobile-product-buy-price">
            <span>{formatProductMoney(priceDisplay.primaryAmount, priceDisplay.primaryCurrency)}</span>
            {priceDisplay.secondaryCurrency && priceDisplay.secondaryAmount !== null ? (
              <small>{formatProductMoney(priceDisplay.secondaryAmount, priceDisplay.secondaryCurrency)}</small>
            ) : null}
            {selectionComplete && selectedVariantSummary ? (
              <div className="mobile-product-buy-selection">{selectedVariantSummary}</div>
            ) : (
              <div className="mobile-product-buy-selection is-placeholder">{t("selectAllVariants")}</div>
            )}
          </div>
          <div className="mobile-product-buy-actions">
            <Sheet>
              <SheetTrigger
                render={
                  <button type="button" className="mobile-product-buy-btn is-cart">
                    <ShoppingCart size={16} />
                    <span>{t("addToCart")}</span>
                  </button>
                }
              />
              <SheetContent side="bottom" className="max-h-[86dvh] overflow-y-auto rounded-t-[28px] border-t border-[#ebe7e0] bg-[#fbfaf8] p-0">
                <SheetHeader className="border-b border-[#ebe7e0] px-4 pb-3 pt-4">
                  <SheetTitle>{t("addToCart")}</SheetTitle>
                  <SheetDescription>{t("buyingNote")}</SheetDescription>
                </SheetHeader>
                <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                  <div className="mobile-product-sheet-stack">
                    <PriceBox
                      primaryPrice={formatProductMoney(priceDisplay.primaryAmount, priceDisplay.primaryCurrency)}
                      secondaryPrice={priceDisplay.secondaryCurrency && priceDisplay.secondaryAmount !== null
                        ? formatProductMoney(priceDisplay.secondaryAmount, priceDisplay.secondaryCurrency)
                        : null}
                    />
                    <VariantSelector
                      product={product}
                      selectedVariants={selectedVariants}
                      onSelect={selectVariant}
                      selectedLabel={(value) => t("selected", { value })}
                    />
                    <QuantityInput
                      value={quantity}
                      max={Math.min(stock || 999, 999)}
                      onChange={setQuantity}
                      label={t("quantity")}
                      maxLabel={t("maxForSku", { count: Math.min(stock || 999, 999) })}
                    />
                    <PurchaseFlowNotice
                      locale={publicLocale}
                      domesticShippingCny={domesticShippingCny}
                      onDomesticShippingChange={setDomesticShippingCny}
                      purchaseWindowLabel={t("purchaseWindow")}
                      sellerLabel={t("sellerLabel")}
                      warehouseLabel={t("warehouseLabel")}
                      addressLabel={t("addressLabel")}
                      domesticLabel={t("domesticLabel")}
                      internationalFreightLabel={t("internationalFreight")}
                      payAfterWeighingLabel={t("payAfterWeighing")}
                    />
                    <PurchaseDisclaimer
                      checked={disclaimerAccepted}
                      onCheckedChange={setDisclaimerAccepted}
                      agreeLabel={t("agree")}
                      disclaimerLabel={t("disclaimer")}
                      disclaimerText={t("disclaimerText")}
                    />
                    <button
                      type="button"
                      className="mobile-product-sheet-cta"
                      disabled={!canSubmitPurchase}
                      onClick={addProductToCart}
                    >
                      <ShoppingCart size={16} />
                      {t("addToCart")}
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Sheet>
              <SheetTrigger
                render={
                  <button type="button" className="mobile-product-buy-btn is-buy">
                    <span>{t("buyNow")}</span>
                  </button>
                }
              />
              <SheetContent side="bottom" className="max-h-[86dvh] overflow-y-auto rounded-t-[28px] border-t border-[#ebe7e0] bg-[#fbfaf8] p-0">
                <SheetHeader className="border-b border-[#ebe7e0] px-4 pb-3 pt-4">
                  <SheetTitle>{t("buyNow")}</SheetTitle>
                  <SheetDescription>{t("faqNote")}</SheetDescription>
                </SheetHeader>
                <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                  <div className="mobile-product-sheet-stack">
                    <div className="mobile-product-sheet-summary">
                      <div>
                        <div className="mobile-product-sheet-summary-label">{t("quantity")}</div>
                        <div className="mobile-product-sheet-summary-value">{quantity}</div>
                      </div>
                      <div>
                        <div className="mobile-product-sheet-summary-label">{t("stockLabel", { count: stock })}</div>
                        <div className="mobile-product-sheet-summary-value">{formatProductMoney(priceDisplay.primaryAmount, priceDisplay.primaryCurrency)}</div>
                      </div>
                    </div>
                    <VariantSelector
                      product={product}
                      selectedVariants={selectedVariants}
                      onSelect={selectVariant}
                      selectedLabel={(value) => t("selected", { value })}
                    />
                    <QuantityInput
                      value={quantity}
                      max={Math.min(stock || 999, 999)}
                      onChange={setQuantity}
                      label={t("quantity")}
                      maxLabel={t("maxForSku", { count: Math.min(stock || 999, 999) })}
                    />
                    <PurchaseDisclaimer
                      checked={disclaimerAccepted}
                      onCheckedChange={setDisclaimerAccepted}
                      agreeLabel={t("agree")}
                      disclaimerLabel={t("disclaimer")}
                      disclaimerText={t("disclaimerText")}
                    />
                    <button
                      type="button"
                      className="mobile-product-sheet-cta is-buy"
                      disabled={!canSubmitPurchase}
                      onClick={buyNow}
                    >
                      {t("buyNow")}
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      </Form>
    </main>
  );
}

function PriceBox({ primaryPrice, secondaryPrice }: { primaryPrice: string; secondaryPrice: string | null }) {
  return (
    <section className="rounded-[20px] border border-[#ffd7df] bg-[#fff8fa] px-4 py-3.5">
      <div className="flex flex-wrap items-end gap-x-2.5 gap-y-1.5">
        <span className="text-[30px] font-black leading-none text-[#e60012]">{primaryPrice}</span>
        {secondaryPrice ? <span className="pb-0.5 text-lg font-black leading-none text-[#111827]">{secondaryPrice}</span> : null}
      </div>
    </section>
  );
}

function VariantSelector({
  product,
  selectedVariants,
  onSelect,
  selectedLabel
}: {
  product: ProductDetail;
  selectedVariants: Record<string, string>;
  onSelect: (groupId: string, optionId: string, image?: string) => void;
  selectedLabel: (value: string) => string;
}) {
  return (
    <section className="space-y-2.5">
      {product.variants.map((group, index) => (
        <div key={group.id} className={cn("space-y-1", index > 0 && "border-t border-[#eef2f6] pt-2.5")}>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <h2 className="text-sm font-black leading-5 text-[#111827]">{group.name}</h2>
            {selectedVariants[group.id] ? (
              <span className="text-[11px] font-bold leading-4 text-[#667085]">
                {selectedLabel(group.options.find((option) => option.id === selectedVariants[group.id])?.label ?? "")}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1">
            {group.options.map((option) => {
              const active = selectedVariants[group.id] === option.id;
              const disabled = isOptionUnavailable(product.skus, selectedVariants, group.id, option.id);
              const hasImage = Boolean(option.image);
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-label={option.label}
                  title={option.label}
                  disabled={disabled}
                  onClick={() => onSelect(group.id, option.id, option.image)}
                  className={cn(
                    "inline-flex items-center justify-center border text-sm font-bold transition",
                    hasImage
                      ? "size-[52px] overflow-hidden rounded-[16px] p-0 sm:size-[54px]"
                      : "min-h-9 rounded-[16px] bg-white px-2.5 py-1.5 leading-none",
                    active
                      ? "border-[#e60012] bg-[#fff1f2] text-[#e60012] shadow-[0_0_0_3px_rgba(230,0,18,0.08)]"
                      : "border-[#d9e7ff] text-[#344054] hover:border-[#e60012] hover:bg-[#fff8fa]",
                    disabled && "cursor-not-allowed opacity-40 hover:border-[#d9e7ff] hover:bg-transparent"
                  )}
                >
                  {option.image ? (
                    <span className="relative size-full">
                      <Image src={option.image} alt="" fill sizes="60px" className="object-cover" />
                    </span>
                  ) : (
                    option.label
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

function QuantityInput({
  value,
  max,
  onChange,
  label,
  maxLabel
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  maxLabel: string;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-black text-[#111827]">{label}</label>
        <span className="text-[11px] font-bold text-[#667085]">{maxLabel}</span>
      </div>
      <div className="inline-grid h-10 max-w-max grid-cols-[40px_68px_40px] overflow-hidden rounded-[18px] border border-[#d9e7ff] bg-white shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
        <button
          type="button"
          className="grid h-10 place-items-center text-[#667085] transition hover:bg-[#f7fbff] active:bg-[#eef4ff]"
          onClick={() => onChange(value - 1)}
        >
          <Minus size={14} />
        </button>
        <Input
          value={value}
          type="number"
          min={1}
          max={max}
          onChange={(event) => onChange(Number(event.target.value) || 1)}
          className="h-10 w-[68px] rounded-none border-y-0 border-x border-[#d9e7ff] bg-white px-2 text-center text-sm font-black [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          className="grid h-10 place-items-center text-[#667085] transition hover:bg-[#f7fbff] active:bg-[#eef4ff]"
          onClick={() => onChange(value + 1)}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function PurchaseFlowNotice({
  className,
  locale,
  domesticShippingCny,
  onDomesticShippingChange,
  purchaseWindowLabel,
  sellerLabel,
  warehouseLabel,
  addressLabel,
  domesticLabel,
  internationalFreightLabel,
  payAfterWeighingLabel
}: {
  className?: string;
  locale: string;
  domesticShippingCny: number;
  onDomesticShippingChange: (value: number) => void;
  purchaseWindowLabel: string;
  sellerLabel: string;
  warehouseLabel: string;
  addressLabel: string;
  domesticLabel: string;
  internationalFreightLabel: string;
  payAfterWeighingLabel: string;
}) {
  return (
    <section className={cn("space-y-2.5 rounded-[20px] border border-[#d9e7ff] bg-[#fbfdff] p-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)]", className)}>
      <div className="flex items-start gap-2.5 rounded-[16px] bg-[#f7fbff] px-3 py-2.5 text-[13px] font-semibold leading-5 text-[#344054]">
        <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#eaf7ff] text-[11px] font-black text-[#0a83ff]">1</span>
        <p>{purchaseWindowLabel}</p>
      </div>

      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2 rounded-[16px] border border-[#e7eef8] bg-white px-3 py-2.5 text-[13px] font-bold leading-5 text-[#475467]">
          <span className="text-[#111827]">{sellerLabel}</span>
          <span className="text-[#e60012]">›</span>
          <span className="text-[#111827]">{warehouseLabel}</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#f7fbff] px-2.5 py-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#667085]">{domesticLabel}</span>
            <span className="inline-flex h-8 min-w-0 items-center rounded-full border border-[#d9e7ff] bg-white px-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
              <span className="mr-1 text-[11px] font-black text-[#667085]">¥</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={domesticShippingCny}
                onChange={(event) => onDomesticShippingChange(Math.max(0, Number(event.target.value) || 0))}
                className="w-14 border-0 bg-transparent text-sm font-black text-[#111827] outline-none"
                aria-label="China shipping fee in CNY"
              />
            </span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-[16px] border border-[#f3d6dc] bg-white px-3 py-2.5 text-[13px] font-bold leading-5 text-[#475467]">
          <span className="text-[#111827]">{warehouseLabel}</span>
          <span className="text-[#e60012]">›</span>
          <span className="text-[#111827]">{addressLabel}</span>
          <Link href={`/${locale}/estimation`} className="inline-flex items-center rounded-full bg-[#fff1f2] px-2.5 py-1 text-[11px] font-black text-[#e60012] transition hover:bg-[#ffe4e8]">
            {internationalFreightLabel}
          </Link>
          <span className="text-[11px] font-semibold text-[#667085]">{payAfterWeighingLabel}</span>
        </div>
      </div>
    </section>
  );
}

function PurchaseDisclaimer({
  checked,
  onCheckedChange,
  agreeLabel,
  disclaimerLabel,
  disclaimerText
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  agreeLabel: string;
  disclaimerLabel: string;
  disclaimerText: string;
}) {
  return (
    <label className="flex cursor-pointer gap-2.5 rounded-[18px] border border-[#d9e7ff] bg-[#fbfdff] p-3 transition hover:border-[#44c9ff] hover:bg-white">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(Boolean(value))}
        aria-label="Agree to CNSnap disclaimer"
        className="mt-0.5 size-[18px] rounded-md border-[#b8c7dc] data-checked:border-[#e60012] data-checked:bg-[#e60012]"
      />
      <span className="min-w-0 text-[13px] font-semibold leading-5 text-[#475467]">
        <span className="font-black text-[#111827]">{agreeLabel}</span>{" "}
        <span className="font-black text-[#111827]">{disclaimerLabel}</span> {disclaimerText}
      </span>
      <Info className="mt-0.5 hidden size-3.5 shrink-0 text-[#44c9ff] sm:block" aria-hidden="true" />
    </label>
  );
}

function ProductInfoTabs({
  product,
  labels
}: {
  product: ProductDetail;
  labels: {
    detailsTab: string;
    specsTab: string;
    shippingTab: string;
    notesTab: string;
    restrictedTab: string;
    faqTab: string;
    shippingNote: string;
    buyingNote: string;
    restrictedNote: string;
    faqNote: string;
  };
}) {
  return (
    <Card className="rounded-[28px] border border-[#d9e7ff] bg-white shadow-[0_16px_40px_rgba(10,131,255,0.08)]">
      <CardContent className="p-4 sm:p-5">
        <Tabs defaultValue="details" className="w-full min-w-0 flex-col gap-4">
          <TabsList className="h-auto w-full flex-wrap justify-start rounded-2xl bg-[#f7fbff] p-1" variant="default">
            {[
              ["details", labels.detailsTab],
              ["specs", labels.specsTab],
              ["shipping", labels.shippingTab],
              ["notes", labels.notesTab],
              ["restricted", labels.restrictedTab],
              ["faq", labels.faqTab]
            ].map(([value, label]) => (
              <TabsTrigger key={value} value={value} className="h-8 flex-none rounded-xl px-3 text-[11px] font-black sm:text-xs">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="details" className="content-page-panel product-description-panel w-full min-w-0 rounded-2xl border border-[#eef2f6] bg-white p-0 text-sm leading-7 text-[#475467]">
            <div className="product-description-html" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
          </TabsContent>
          <TabsContent value="specs" className="w-full min-w-0 rounded-2xl border border-[#eef2f6] p-3.5 sm:p-4">
            <dl className="grid gap-2.5 sm:grid-cols-2">
              {product.specs.map((spec) => (
                <div key={spec.name} className="rounded-[18px] bg-[#f7fbff] p-3">
                  <dt className="text-[11px] font-black uppercase tracking-[0.08em] text-[#667085]">{spec.name}</dt>
                  <dd className="mt-1 text-sm font-bold text-[#111827]">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </TabsContent>
          <TabsContent value="shipping" className="w-full min-w-0 rounded-2xl border border-[#eef2f6] p-3.5 text-sm font-semibold leading-6 text-[#475467] sm:p-4">
            {labels.shippingNote}
          </TabsContent>
          <TabsContent value="notes" className="w-full min-w-0 rounded-2xl border border-[#eef2f6] p-3.5 text-sm font-semibold leading-6 text-[#475467] sm:p-4">
            {labels.buyingNote}
          </TabsContent>
          <TabsContent value="restricted" className="w-full min-w-0 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm font-semibold leading-6 text-amber-900 sm:p-4">
            <div className="flex gap-2">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              {labels.restrictedNote}
            </div>
          </TabsContent>
          <TabsContent value="faq" className="w-full min-w-0 rounded-2xl border border-[#eef2f6] p-3.5 text-sm font-semibold leading-6 text-[#475467] sm:p-4">
            {labels.faqNote}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function findSelectedSku(skus: ProductSkuDetail[], selectedVariants: Record<string, string>) {
  const selectedEntries = Object.entries(selectedVariants).filter(([, value]) => Boolean(value));
  if (!selectedEntries.length) return undefined;
  return skus.find((sku) => selectedEntries.every(([groupId, optionId]) => sku.optionIds[groupId] === optionId));
}

function isOptionUnavailable(skus: ProductSkuDetail[], selectedVariants: Record<string, string>, groupId: string, optionId: string) {
  const nextSelection = { ...selectedVariants, [groupId]: optionId };
  const selectedEntries = Object.entries(nextSelection).filter(([, value]) => Boolean(value));
  return !skus.some((sku) => selectedEntries.every(([selectedGroupId, selectedOptionId]) => sku.optionIds[selectedGroupId] === selectedOptionId) && sku.stock > 0);
}

function numericProductId(id: string) {
  const numeric = Number(id.replace(/\D/g, "").slice(-9));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : Date.now();
}
