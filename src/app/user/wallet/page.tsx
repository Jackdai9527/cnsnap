import { prisma } from "@/lib/db";
import { money } from "@/lib/currency";
import { getCurrentUser } from "@/lib/session";
import { WalletRechargePanel } from "@/components/wallet/WalletRechargePanel";
import { getOnlyPaySettings, onlyPayReady } from "@/modules/payment/onlypay";
import { getPayPalSettings, paypalReady, paypalSdkUrl } from "@/modules/payment/paypal";

export default async function UserWalletPage() {
  const user = await getCurrentUser();
  const [transactions, rechargePayments, onlyPaySettings, paypalSettings] = await Promise.all([
    prisma.walletTransaction.findMany({ where: { userId: user?.id }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.payment.findMany({
      where: { userId: user?.id, type: "wallet_recharge" },
      orderBy: { createdAt: "desc" },
      take: 8
    }),
    getOnlyPaySettings(),
    getPayPalSettings()
  ]);
  const methods = [
    {
      id: "onlypay" as const,
      title: onlyPaySettings.title || "Credit Card / Wallet",
      description: "Pay online and return to the wallet after checkout.",
      enabled: onlyPayReady(onlyPaySettings)
    },
    {
      id: "paypal" as const,
      title: paypalSettings.title || "PayPal Checkout",
      description: paypalSettings.advancedCardEnabled ? "Pay with PayPal wallet or eligible card fields." : "Pay with your PayPal wallet.",
      enabled: paypalReady(paypalSettings),
      sdkUrl: paypalSdkUrl(paypalSettings, paypalSettings.advancedCardEnabled ? ["buttons", "card-fields"] : ["buttons"]),
      advancedCardEnabled: paypalSettings.advancedCardEnabled
    },
    {
      id: "bank_transfer" as const,
      title: "Bank transfer",
      description: "Submit a recharge request first. Balance is credited after manual confirmation.",
      enabled: true
    }
  ];

  return (
    <section className="space-y-6">
      <div className="brand-surface overflow-hidden rounded-[28px]">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="p-6 md:p-8">
            <div className="label">Balance and recharge</div>
            <h1 className="mt-2 font-display text-5xl font-black text-[#101828]">Wallet</h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#667085]">
              Add funds for product orders, shipping fees, refunds, and manual adjustments.
            </p>
          </div>
          <div className="border-t border-[#e8eef7] bg-white/70 p-6 md:p-8 lg:border-l lg:border-t-0">
            <div className="label">Current balance</div>
            <div className="mt-2 font-display text-5xl font-black text-[#d9142f] md:text-6xl">{money(Number(user?.walletBalance ?? 0))}</div>
            <div className="mt-3 rounded-full border border-[#dfe7f1] bg-white px-3 py-1.5 text-xs font-extrabold text-[#667085]">
              Available wallet funds
            </div>
          </div>
        </div>
      </div>

      <div>
        <WalletRechargePanel methods={methods} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="panel p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="label">Ledger</div>
              <h2 className="mt-1 font-display text-3xl font-black">Wallet activity</h2>
            </div>
            <span className="rounded-full border border-[#dfe7f1] bg-[#f8fafc] px-3 py-1 text-xs font-extrabold text-[#667085]">
              {transactions.length} records
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {transactions.length ? transactions.map((tx) => (
              <div key={tx.id} className="rounded-2xl border border-[#dfe7f1] bg-white p-4 text-sm font-semibold text-[#667085]">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <strong className="text-[#101828]">{tx.type}</strong>
                    {tx.note ? <span> · {tx.note}</span> : null}
                    <div className="mt-1 text-xs text-[#98a2b3]">{tx.createdAt.toLocaleString()}</div>
                  </div>
                  <strong className={Number(tx.amount) >= 0 ? "text-[#15803d]" : "text-[#d9142f]"}>
                    {Number(tx.amount) >= 0 ? "+" : ""}{money(Number(tx.amount), tx.currency)}
                  </strong>
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-[#dfe7f1] bg-[#f8fafc] p-6 text-sm font-semibold text-[#667085]">
                No wallet activity yet.
              </div>
            )}
          </div>
        </section>

        <section className="panel p-5 md:p-6">
          <div className="label">Recharge requests</div>
          <h2 className="mt-1 font-display text-3xl font-black">Recent top-ups</h2>
          <div className="mt-4 space-y-2">
            {rechargePayments.length ? rechargePayments.map((payment) => (
              <div key={payment.id} className="rounded-2xl border border-[#dfe7f1] bg-[#f8fafc] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-extrabold text-[#101828]">{payment.paymentMethod || payment.provider}</div>
                    <div className="mt-1 text-xs font-semibold text-[#98a2b3]">{payment.paymentNo} · {payment.createdAt.toLocaleString()}</div>
                  </div>
                  <span className="rounded-full border border-[#dfe7f1] bg-white px-3 py-1 text-xs font-extrabold text-[#667085]">{payment.status}</span>
                </div>
                <div className="mt-3 font-display text-2xl font-black text-[#d9142f]">{money(Number(payment.amount), payment.currency)}</div>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-[#dfe7f1] bg-[#f8fafc] p-6 text-sm font-semibold text-[#667085]">
                New recharge requests will appear here.
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
