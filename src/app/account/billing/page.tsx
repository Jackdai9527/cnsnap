import Link from "next/link";
import { CreditCard, ReceiptText, WalletCards } from "lucide-react";
import { MobileBillingWorkspace } from "@/components/account/mobile/MobileBillingWorkspace";
import { MobileSectionShell } from "@/components/mobile/layout/MobileSectionShell";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { AccountStatusBadge } from "@/components/account/AccountStatusBadge";
import { getAccountBillingWorkspace } from "@/lib/account/workspaces";

function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

export default async function AccountBillingPage() {
  const workspace = await getAccountBillingWorkspace();
  const title = "Billing";
  const description = "Manage wallet, recharge activity, and payment-related order records.";

  return (
    <>
      <MobileSectionShell
        title={title}
        description={description}
        kicker={title}
        className="mobile-billing-page md:hidden"
        minimalHeader
        showBackButton
      >
        <section className="card-stack-section">
          <div className="mobile-account-grid">
            <article className="mobile-account-shortcut p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Balance</div>
              <div className="mt-2 text-xl font-black text-slate-950">{money(workspace.summary.balanceUsd)}</div>
            </article>
            <article className="mobile-account-shortcut p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Recharge</div>
              <div className="mt-2 text-xl font-black text-slate-950">{money(workspace.summary.rechargeUsd)}</div>
            </article>
            <article className="mobile-account-shortcut p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Spend</div>
              <div className="mt-2 text-xl font-black text-slate-950">{money(workspace.summary.spendUsd)}</div>
            </article>
            <article className="mobile-account-shortcut p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Refund</div>
              <div className="mt-2 text-xl font-black text-slate-950">{money(workspace.summary.refundUsd)}</div>
            </article>
          </div>
        </section>

        <section className="card-stack-section">
          <div className="mobile-order-card p-4">
            <MobileBillingWorkspace
              title="Pending billing actions"
              description="Pending order and shipping payments will appear here."
              allLabel="All"
              orderPaymentsLabel="Order payments"
              shippingPaymentsLabel="Shipping payments"
              orderPaymentDueLabel="Order payment due"
              shippingPaymentDueLabel="Shipping payment due"
              pendingOrderPayments={workspace.pendingOrderPayments.map((item) => ({ ...item, kind: "order" as const }))}
              pendingShippingPayments={workspace.pendingShippingPayments.map((item) => ({ ...item, kind: "shipping" as const }))}
            />
          </div>
        </section>

        <section className="card-stack-section">
          <div className="mobile-order-card p-4">
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Recent wallet activity</div>
            <div className="mobile-account-list">
              {workspace.transactions.slice(0, 6).map((tx) => (
                <div key={tx.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-black text-slate-950">{tx.transactionNo}</div>
                    <div className={tx.amount >= 0 ? "text-sm font-black text-emerald-700" : "text-sm font-black text-rose-700"}>
                      {tx.amount >= 0 ? "+" : ""}{money(tx.amount, tx.currency)}
                    </div>
                  </div>
                  <div className="mt-2"><AccountStatusBadge status={tx.type} /></div>
                  <div className="mt-2 text-xs text-slate-500">{tx.note || "Balance activity"}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card-stack-section">
          <div className="mobile-order-card p-4">
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Recent recharges</div>
            <div className="mobile-account-list">
              {workspace.rechargePayments.length ? workspace.rechargePayments.map((payment) => (
                <div key={payment.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-black text-slate-950">{payment.paymentNo}</div>
                    <AccountStatusBadge status={payment.status} />
                  </div>
                  <div className="mt-2 text-sm font-black text-slate-950">{money(payment.amount, payment.currency)}</div>
                  <div className="mt-1 text-xs text-slate-500">{payment.method}</div>
                </div>
              )) : (
                <div className="mobile-cart-empty">
                  <h2>No recharge records yet</h2>
                  <p>Recharge requests will appear here after you submit them.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </MobileSectionShell>

      <div className="hidden md:block">
        <AccountPageHeader title={title} description={description} />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Balance" value={money(workspace.summary.balanceUsd)} icon={<WalletCards className="size-4" />} />
          <MetricCard label="Recharge" value={money(workspace.summary.rechargeUsd)} icon={<CreditCard className="size-4" />} />
          <MetricCard label="Spend" value={money(workspace.summary.spendUsd)} icon={<ReceiptText className="size-4" />} />
          <MetricCard label="Refund" value={money(workspace.summary.refundUsd)} icon={<WalletCards className="size-4" />} />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-2">
          <WorkbenchCard title="Pending order payments">
            {workspace.pendingOrderPayments.length ? workspace.pendingOrderPayments.map((item) => (
              <Link key={item.id} href={item.href} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <div className="text-sm font-black text-slate-950">{item.orderNo}</div>
                  <div className="mt-1"><AccountStatusBadge status={item.status} /></div>
                </div>
                <div className="text-sm font-black text-slate-950">{money(item.amountUsd)}</div>
              </Link>
            )) : <EmptyCopy text="No pending product payments." />}
          </WorkbenchCard>
          <WorkbenchCard title="Pending shipping payments">
            {workspace.pendingShippingPayments.length ? workspace.pendingShippingPayments.map((item) => (
              <Link key={item.id} href={item.href} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <div className="text-sm font-black text-slate-950">{item.packageNo}</div>
                  <div className="mt-1"><AccountStatusBadge status={item.status} /></div>
                </div>
                <div className="text-sm font-black text-slate-950">{money(item.amountUsd)}</div>
              </Link>
            )) : <EmptyCopy text="No pending shipping payments." />}
          </WorkbenchCard>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <WorkbenchCard title="Recent wallet activity">
            {workspace.transactions.slice(0, 8).map((tx) => (
              <div key={tx.id} className="flex items-start justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div>
                  <div className="text-sm font-black text-slate-950">{tx.transactionNo}</div>
                  <div className="mt-1"><AccountStatusBadge status={tx.type} /></div>
                  <div className="mt-2 text-xs text-slate-500">{tx.note || "Balance activity"} · {tx.createdAt}</div>
                </div>
                <div className={tx.amount >= 0 ? "text-sm font-black text-emerald-700" : "text-sm font-black text-rose-700"}>
                  {tx.amount >= 0 ? "+" : ""}{money(tx.amount, tx.currency)}
                </div>
              </div>
            ))}
          </WorkbenchCard>
          <WorkbenchCard title="Recent recharge requests">
            {workspace.rechargePayments.length ? workspace.rechargePayments.map((payment) => (
              <div key={payment.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-black text-slate-950">{payment.paymentNo}</div>
                  <AccountStatusBadge status={payment.status} />
                </div>
                <div className="mt-2 text-sm font-black text-slate-950">{money(payment.amount, payment.currency)}</div>
                <div className="mt-1 text-xs text-slate-500">{payment.method} · {payment.createdAt}</div>
              </div>
            )) : <EmptyCopy text="No recharge requests yet." />}
          </WorkbenchCard>
        </section>
      </div>
    </>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</div>
        <span className="grid size-9 place-items-center rounded-2xl bg-[#f7fbff] text-[#0a83ff]">{icon}</span>
      </div>
      <div className="mt-3 text-2xl font-black text-slate-950">{value}</div>
    </article>
  );
}

function WorkbenchCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <div className="text-lg font-black text-slate-950">{title}</div>
      <div className="mt-4 grid gap-3">{children}</div>
    </section>
  );
}

function EmptyCopy({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm font-semibold text-slate-500">{text}</div>;
}
