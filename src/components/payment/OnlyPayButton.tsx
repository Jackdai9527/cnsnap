import Image from "next/image";
import { getOnlyPaySettings, onlyPayReady } from "@/modules/payment/onlypay";

type OnlyPayButtonProps = {
  orderId: number;
  packageId?: number;
  disabled?: boolean;
};

const logos = [
  ["Visa", "/payment-logos/card_visa.svg"],
  ["Mastercard", "/payment-logos/card_mastercard.svg"],
  ["Apple Pay", "/payment-logos/card_apple-pay.svg"],
  ["Google Pay", "/payment-logos/card_google-pay.svg"]
];

export async function OnlyPayButton({ orderId, packageId, disabled }: OnlyPayButtonProps) {
  const settings = await getOnlyPaySettings();
  if (!onlyPayReady(settings)) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
        ONLYPAY is not configured yet. Enable it in Admin Settings after adding mchId, appId, and signKey.
      </div>
    );
  }

  return (
    <form action="/api/payments/onlypay/create" method="post" className="mt-2">
      <input type="hidden" name="orderId" value={orderId} />
      {packageId ? <input type="hidden" name="packageId" value={packageId} /> : null}
      <button className="btn-primary w-full" disabled={disabled}>{settings.title}</button>
      <div className="mt-3 flex items-center justify-center gap-2">
        {logos.map(([alt, src]) => (
          <span key={alt} className="grid h-8 w-12 place-items-center rounded-md border border-[#d9e7ff] bg-white px-1">
            <Image src={src} alt={alt} width={40} height={24} className="max-h-6 w-auto" />
          </span>
        ))}
      </div>
    </form>
  );
}
