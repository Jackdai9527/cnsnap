"use client";

import Script from "next/script";
import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";

type PayPalCheckoutClientProps = {
  orderId?: number;
  packageId?: number;
  walletAmount?: number;
  sdkUrl: string;
  title: string;
  advancedCardEnabled: boolean;
};

type PayPalButtons = {
  render: (selector: string | HTMLElement) => Promise<void>;
  close?: () => void;
};

type PayPalCardFields = {
  render: (selector: string | HTMLElement) => Promise<void>;
  submit: () => Promise<void>;
  close?: () => void;
};

type PayPalCardFieldsNamespace = {
  isEligible?: () => boolean;
  NameField: () => PayPalCardFields;
  NumberField: () => PayPalCardFields;
  ExpiryField: () => PayPalCardFields;
  CVVField: () => PayPalCardFields;
};

type PayPalSdk = {
  Buttons?: (options: {
    style?: Record<string, string | number | boolean>;
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID?: string }) => Promise<void>;
    onError: (error: unknown) => void;
    onCancel?: () => void;
  }) => PayPalButtons;
  CardFields?: (options: {
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID?: string }) => Promise<void>;
    onError: (error: unknown) => void;
  }) => PayPalCardFields & PayPalCardFieldsNamespace;
};

declare global {
  interface Window {
    paypal?: PayPalSdk;
  }
}

export function PayPalCheckoutClient({ orderId, packageId, walletAmount, sdkUrl, title, advancedCardEnabled }: PayPalCheckoutClientProps) {
  const buttonsRef = useRef<HTMLDivElement>(null);
  const cardNameRef = useRef<HTMLDivElement>(null);
  const cardNumberRef = useRef<HTMLDivElement>(null);
  const cardExpiryRef = useRef<HTMLDivElement>(null);
  const cardCvvRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);
  const cardFieldsRef = useRef<PayPalCardFields | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const createOrder = useCallback(async () => {
    setError("");
    setNotice("Connecting to PayPal...");
    const isWalletRecharge = typeof walletAmount === "number";
    const response = await fetch(isWalletRecharge ? "/api/wallet/recharge" : "/api/payments/paypal/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isWalletRecharge ? { method: "paypal", amount: walletAmount } : { orderId, packageId })
    });
    const data = await response.json();
    if (!response.ok || !data.id) {
      throw new Error(data.error || "Could not create PayPal order.");
    }
    return String(data.id);
  }, [orderId, packageId, walletAmount]);

  const captureOrder = useCallback(async (paypalOrderId?: string) => {
    if (!paypalOrderId) throw new Error("PayPal did not return an order id.");
    setProcessing(true);
    setNotice("Confirming payment...");
    try {
      const response = await fetch("/api/payments/paypal/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paypalOrderId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "PayPal capture failed.");
      const target = data.type === "wallet_recharge" || typeof walletAmount === "number"
        ? "/account/wallet?payment=paypal_paid"
        : packageId
          ? `/account/packages/${packageId}?payment=paypal_paid`
          : `/account/orders/${orderId}?payment=paypal_paid`;
      window.location.href = target;
    } catch (caught) {
      setProcessing(false);
      setNotice("");
      setError(caught instanceof Error ? caught.message : "PayPal capture failed.");
    }
  }, [orderId, packageId, walletAmount]);

  useEffect(() => {
    if (!scriptReady || renderedRef.current || !window.paypal?.Buttons || !buttonsRef.current) return;
    renderedRef.current = true;

    const buttons = window.paypal.Buttons({
      style: {
        layout: "vertical",
        color: "gold",
        shape: "rect",
        label: "paypal",
        height: 44
      },
      createOrder,
      onApprove: (data) => captureOrder(data.orderID),
      onError: (caught) => {
        setNotice("");
        setProcessing(false);
        setError(caught instanceof Error ? caught.message : "PayPal payment failed.");
      },
      onCancel: () => {
        setNotice("");
        setProcessing(false);
      }
    });

    buttons.render(buttonsRef.current).catch((caught) => {
      renderedRef.current = false;
      setError(caught instanceof Error ? caught.message : "PayPal button could not be loaded.");
    });

    if (advancedCardEnabled && window.paypal.CardFields && cardNameRef.current && cardNumberRef.current && cardExpiryRef.current && cardCvvRef.current) {
      const cardFields = window.paypal.CardFields({
        createOrder,
        onApprove: (data) => captureOrder(data.orderID),
        onError: (caught) => {
          setNotice("");
          setProcessing(false);
          setError(caught instanceof Error ? caught.message : "Card payment failed.");
        }
      });
      const eligible = cardFields.isEligible ? cardFields.isEligible() : true;
      if (eligible) {
        cardFieldsRef.current = cardFields;
        Promise.all([
          cardFields.NameField().render(cardNameRef.current),
          cardFields.NumberField().render(cardNumberRef.current),
          cardFields.ExpiryField().render(cardExpiryRef.current),
          cardFields.CVVField().render(cardCvvRef.current)
        ]).then(() => setCardReady(true)).catch((caught) => {
          setError(caught instanceof Error ? caught.message : "Advanced Card Payments could not be loaded.");
        });
      } else {
        window.setTimeout(() => setNotice("Advanced Card Payments is not available for this PayPal account yet."), 0);
      }
    }

    return () => {
      renderedRef.current = false;
      buttons.close?.();
      cardFieldsRef.current?.close?.();
      cardFieldsRef.current = null;
    };
  }, [advancedCardEnabled, captureOrder, createOrder, scriptReady]);

  async function submitCard() {
    setError("");
    setNotice("Submitting card payment...");
    setProcessing(true);
    try {
      await cardFieldsRef.current?.submit();
    } catch (caught) {
      setProcessing(false);
      setNotice("");
      setError(caught instanceof Error ? caught.message : "Card payment failed.");
    }
  }

  return (
    <section className="mt-2">
      <Script id="paypal-checkout-sdk" src={sdkUrl} strategy="afterInteractive" onLoad={() => setScriptReady(true)} onError={() => setError("PayPal SDK could not be loaded.")} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-[#111827]">{title}</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#667085]">Pay securely with PayPal wallet or eligible cards.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#f7fbff] px-3 py-2 text-xs font-black text-[#667085]">
          <ShieldCheck size={15} className="text-[#2563eb]" />
          Encrypted checkout
        </div>
      </div>

      <div className="mt-4 min-h-[46px]" ref={buttonsRef} />

      {advancedCardEnabled ? (
        <div className="mt-4 rounded-xl bg-[#fffafd] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-[#111827]">
            <CreditCard size={17} className="text-[#e60012]" />
            Advanced Card Payments
          </div>
          <div className="grid gap-3">
            <PayPalCardField label="Name on card" refValue={cardNameRef} />
            <PayPalCardField label="Card number" refValue={cardNumberRef} />
            <div className="grid gap-3 sm:grid-cols-2">
              <PayPalCardField label="Expiry date" refValue={cardExpiryRef} />
              <PayPalCardField label="CVV" refValue={cardCvvRef} />
            </div>
          </div>
          <button type="button" onClick={submitCard} disabled={!cardReady || processing} className="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-60">
            {processing ? <Loader2 size={17} className="animate-spin" /> : <CreditCard size={17} />}
            {processing ? "Processing..." : "Pay by card"}
          </button>
        </div>
      ) : null}

      {notice ? <p className="mt-3 rounded-2xl border border-[#d9e7ff] bg-[#f7fbff] px-4 py-3 text-sm font-bold text-[#2563eb]">{notice}</p> : null}
      {error ? <p className="mt-3 rounded-2xl border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-sm font-bold text-[#be123c]">{error}</p> : null}
    </section>
  );
}

function PayPalCardField({ label, refValue }: { label: string; refValue: RefObject<HTMLDivElement | null> }) {
  return (
    <label className="grid gap-1 text-xs font-black text-[#667085]">
      {label}
      <span ref={refValue} className="block min-h-[46px] rounded-xl border border-[#d9e7ff] bg-white px-3 py-2" />
    </label>
  );
}
