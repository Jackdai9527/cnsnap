"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Banknote, CreditCard, Loader2, Plus, ShieldCheck, WalletCards } from "lucide-react";
import { useTranslations } from "next-intl";
import { PayPalCheckoutClient } from "@/components/payment/PayPalCheckoutClient";
import { money } from "@/lib/pricing";

type PaymentMethod = {
  id: "onlypay" | "paypal" | "bank_transfer";
  title: string;
  description: string;
  enabled: boolean;
  sdkUrl?: string;
  advancedCardEnabled?: boolean;
};

type WalletRechargePanelProps = {
  methods: PaymentMethod[];
};

const presetAmounts = [20, 50, 100, 200, 500, 1000];

export function WalletRechargePanel({ methods }: WalletRechargePanelProps) {
  const t = useTranslations("account.recharge.panel");
  const availableMethods = methods.filter((method) => method.enabled);
  const [amount, setAmount] = useState(presetAmounts[1]);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod["id"]>(availableMethods[0]?.id ?? "bank_transfer");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const paypalMethod = availableMethods.find((method) => method.id === "paypal");

  const selectedAmount = useMemo(() => {
    const custom = Number(customAmount);
    return customAmount.trim() ? custom : amount;
  }, [amount, customAmount]);

  async function submitRecharge() {
    setError("");
    setMessage("");
    const rechargeAmount = Math.round((Number(selectedAmount) + Number.EPSILON) * 100) / 100;
    if (!Number.isFinite(rechargeAmount) || rechargeAmount < 5) {
      setError(t("minimumError"));
      return;
    }

    if (selectedMethod === "paypal") {
      setMessage(t("paypalHint"));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/wallet/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: rechargeAmount, method: selectedMethod })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Recharge failed.");

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      setMessage(data.message || t("submitted"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-[#e8eef7] bg-[#fbfcff] px-5 py-5 md:px-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="label">{t("kicker")}</div>
            <h2 className="mt-1 font-display text-3xl font-black text-[#101828]">{t("title")}</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#667085]">
              {t("description")}
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#dfe7f1] bg-white px-3 py-2 text-xs font-extrabold text-[#475467]">
            <ShieldCheck size={15} className="text-[#2563eb]" />
            {t("secure")}
          </div>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="p-5 md:p-7">
          <div className="label">{t("amount")}</div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-3">
            {presetAmounts.map((value) => {
              const active = !customAmount && amount === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setAmount(value);
                    setCustomAmount("");
                  }}
                  className={`min-h-[78px] rounded-2xl border px-4 py-4 text-left font-display text-2xl font-black transition ${
                    active
                      ? "border-[#d9142f] bg-[#fff1f3] text-[#d9142f] shadow-[0_12px_24px_rgba(217,20,47,0.12)]"
                      : "border-[#dfe7f1] bg-white text-[#101828] hover:border-[#2563eb] hover:text-[#2563eb]"
                  }`}
                >
                  {money(value)}
                </button>
              );
            })}
          </div>
          <label className="mt-5 block max-w-xl">
            <span className="label">{t("customAmount")}</span>
            <div className="mt-2 flex items-center rounded-2xl border border-[#dfe7f1] bg-white px-4 transition focus-within:border-[#2563eb] focus-within:ring-4 focus-within:ring-[#2563eb]/10">
              <span className="font-display text-2xl font-black text-[#98a2b3]">$</span>
              <input
                type="number"
                min="5"
                max="5000"
                step="0.01"
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
                placeholder={t("customPlaceholder")}
                className="w-full border-0 bg-transparent px-3 py-4 text-lg font-extrabold text-[#101828] outline-none placeholder:text-[#98a2b3]"
              />
            </div>
          </label>
        </div>

        <aside className="border-t border-[#e8eef7] bg-[#fbfcff] p-5 md:p-7 xl:border-l xl:border-t-0">
          <div className="label">{t("paymentMethod")}</div>
          <div className="mt-3 space-y-3">
            {availableMethods.map((method) => {
              const active = selectedMethod === method.id;
              const Icon = method.id === "paypal" ? WalletCards : method.id === "onlypay" ? CreditCard : Banknote;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    active
                      ? "border-[#2563eb] bg-[#eff6ff] shadow-[0_14px_28px_rgba(37,99,235,0.12)]"
                      : "border-[#dfe7f1] bg-white hover:border-[#2563eb]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`rounded-xl p-2 ${active ? "bg-white text-[#2563eb]" : "bg-[#f2f4f7] text-[#667085]"}`}>
                      <Icon size={20} />
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold text-[#101828]">{method.title}</span>
                      <span className="mt-1 block text-xs font-semibold leading-5 text-[#667085]">{method.description}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-[#dfe7f1] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-[#667085]">{t("rechargeTotal")}</span>
              <strong className="font-display text-3xl font-black text-[#d9142f]">{money(selectedAmount || 0)}</strong>
            </div>
            <button
              type="button"
              onClick={submitRecharge}
              disabled={loading || !availableMethods.length}
              className="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />}
              {loading ? t("submitting") : t("rechargeNow")}
              {!loading ? <ArrowRight size={17} /> : null}
            </button>
          </div>

          {message ? <p className="mt-3 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm font-bold text-[#15803d]">{message}</p> : null}
          {error ? <p className="mt-3 rounded-2xl border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-sm font-bold text-[#be123c]">{error}</p> : null}
        </aside>
      </div>
      {selectedMethod === "paypal" && paypalMethod?.sdkUrl ? (
        <div className="border-t border-[#e8eef7] bg-white px-5 py-5 md:px-7">
          <PayPalCheckoutClient
            walletAmount={Math.round((Number(selectedAmount || 0) + Number.EPSILON) * 100) / 100}
            sdkUrl={paypalMethod.sdkUrl}
            title={paypalMethod.title}
            advancedCardEnabled={Boolean(paypalMethod.advancedCardEnabled)}
          />
        </div>
      ) : null}
    </section>
  );
}
