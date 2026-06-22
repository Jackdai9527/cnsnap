"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WalletCards } from "lucide-react";

type BalancePaymentButtonProps = {
  orderId: number;
  packageId?: number;
  amountDue: number;
  currentBalance: number;
  preferred?: boolean;
};

export function BalancePaymentButton({ orderId, packageId, amountDue, currentBalance, preferred = false }: BalancePaymentButtonProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const hasEnoughBalance = currentBalance >= amountDue;

  async function payWithBalance() {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/payments/balance/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, packageId })
      });
      const json = await response.json().catch(() => ({})) as { error?: string; redirectTo?: string };
      if (!response.ok) {
        throw new Error(json.error || "Balance payment failed.");
      }
      if (json.redirectTo) {
        window.location.href = json.redirectTo;
        return;
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Balance payment failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`${preferred ? "" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-[#111827]">
            <WalletCards size={17} className="text-[#e60012]" />
            CNSnap Balance
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">
            Pay directly from your recharge balance or future affiliate commission balance.
          </p>
        </div>
        {preferred ? (
          <span className="rounded-full bg-[#e60012] px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-white">
            Selected
          </span>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 rounded-xl bg-white px-1 py-1 sm:grid-cols-2">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">Current balance</div>
          <div className="mt-1 text-lg font-black text-slate-950">${currentBalance.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">After this payment</div>
          <div className={`mt-1 text-lg font-black ${hasEnoughBalance ? "text-emerald-700" : "text-red-700"}`}>
            ${(currentBalance - amountDue).toFixed(2)}
          </div>
        </div>
      </div>
      <div className={`mt-3 rounded-xl px-3 py-2 text-sm font-bold ${hasEnoughBalance ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
        {hasEnoughBalance
          ? "Your CNSnap Balance is enough to cover this payment."
          : "Your CNSnap Balance is not enough for this payment. Please recharge or choose another method."}
      </div>
      <button type="button" onClick={payWithBalance} disabled={submitting || !hasEnoughBalance} className="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-60">
        {submitting ? "Processing..." : "Pay with CNSnap Balance"}
      </button>
      {error ? <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</div> : null}
    </div>
  );
}
