import Image from "next/image";
import { CopyButton } from "@/components/payment/CopyButton";
import { isSepaEligible, payableEur, payableUsd, sepaReady, sepaReference, type SepaSettings } from "@/modules/payment/sepa";

type SepaOrder = {
  id: number;
  orderNo: string;
  currency: string;
  destinationCountry?: string | null;
  destinationCountryCode?: string | null;
  unpaidUsd: { toString(): string };
  totalUsd: { toString(): string };
  paidUsd: { toString(): string };
  address?: { country: string } | null;
};

type SepaInstantPaymentProps = {
  order: SepaOrder;
  packageId?: number;
  settings: SepaSettings;
};

const logos = [
  ["SEPA", "/payment-logos/sepa/SEPA-logo.png", 62],
  ["EUR", "/payment-logos/sepa/eur.svg", 32],
  ["Wise", "/payment-logos/sepa/wise.svg", 42],
  ["Revolut", "/payment-logos/sepa/revolut.svg", 52],
  ["N26", "/payment-logos/sepa/n26.svg", 38],
  ["ING", "/payment-logos/sepa/ing.svg", 42]
] as const;

export function SepaInstantPayment({ order, packageId, settings }: SepaInstantPaymentProps) {
  const countryCode = order.address?.country || order.destinationCountryCode || order.destinationCountry;
  if (!isSepaEligible({ currency: order.currency, countryCode })) return null;
  if (!settings.enabled) return null;

  if (!sepaReady(settings)) {
    return (
      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
        SEPA Instant Payments is available for this order, but the bank account details are not configured yet.
      </div>
    );
  }

  const amountUsd = payableUsd({
    unpaidUsd: order.unpaidUsd,
    totalUsd: order.totalUsd,
    paidUsd: order.paidUsd
  });
  const amountEur = order.currency.toUpperCase() === "EUR" ? amountUsd : payableEur(amountUsd, settings);
  const reference = sepaReference(settings, order.orderNo);
  const bankRows = [
    ["Beneficiary", settings.beneficiaryName, true],
    ["IBAN", settings.iban, true],
    ["BIC/SWIFT", settings.bic, true],
    ["Bank", settings.bankName, false],
    ["Bank Address", settings.bankAddress, false],
    ["Reference", reference, true],
    ["Amount to transfer", `EUR ${amountEur.toFixed(2)}`, false]
  ] as const;

  return (
    <section className="mt-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-[#111827]">{settings.title}</h3>
        </div>
        <div className="flex max-w-full shrink-0 items-center gap-1.5 overflow-hidden">
          {logos.map(([alt, src, width]) => (
            <span key={alt} className="grid h-8 w-12 place-items-center rounded-lg bg-white px-1">
              <Image src={src} alt={alt} width={width} height={24} className="max-h-6 w-auto" />
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 text-sm leading-6 text-[#667085]" dangerouslySetInnerHTML={{ __html: settings.description }} />

      <div className="mt-4 overflow-hidden rounded-xl border border-[#eadfe4]">
        {bankRows.filter(([, value]) => Boolean(value)).map(([label, value, copy]) => (
          <div key={label} className="grid grid-cols-[116px_1fr_auto] items-center gap-2 border-b border-[#f6e5eb] px-3 py-2.5 text-sm last:border-0">
            <div className="text-xs font-black uppercase tracking-[0.08em] text-[#a39ba6]">{label}</div>
            <div className="break-all font-bold text-[#111827]">{value}</div>
            {copy ? <CopyButton value={value} /> : <span />}
          </div>
        ))}
      </div>

      <form action="/api/payments/sepa/create" method="post" className="mt-4 grid gap-3">
        <input type="hidden" name="orderId" value={order.id} />
        {packageId ? <input type="hidden" name="packageId" value={packageId} /> : null}
        <label className="grid gap-1 text-xs font-black text-[#667085]">
          Bank Account Holder Name
          <input name="holderName" required minLength={2} placeholder="Enter the name on your bank account" className="input rounded-xl" />
        </label>
        <label className="grid gap-1 text-xs font-black text-[#667085]">
          Transaction Reference (last 4 chars)
          <input name="transactionReference" required minLength={4} maxLength={4} placeholder="e.g. A3F9" className="input rounded-xl uppercase" />
        </label>
        {settings.tips ? <p className="text-xs leading-5 text-[#8a8190]">{settings.tips}</p> : null}
        <button className="btn-primary w-full">I have submitted SEPA transfer</button>
      </form>

      {settings.instructions ? <div className="mt-3 text-xs leading-5 text-[#8a8190]" dangerouslySetInnerHTML={{ __html: settings.instructions }} /> : null}
    </section>
  );
}
