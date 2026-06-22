import { PayPalCheckoutClient } from "@/components/payment/PayPalCheckoutClient";
import { getPayPalSettings, paypalClientId, paypalReady, paypalSdkUrl } from "@/modules/payment/paypal";

type PayPalPaymentProps = {
  orderId: number;
  packageId?: number;
};

export async function PayPalPayment({ orderId, packageId }: PayPalPaymentProps) {
  const settings = await getPayPalSettings();
  if (!settings.enabled) return null;

  if (!paypalReady(settings)) {
    return (
      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
        PayPal Checkout is enabled but missing the {settings.mode} client ID or secret.
      </div>
    );
  }

  return (
    <PayPalCheckoutClient
      orderId={orderId}
      packageId={packageId}
      sdkUrl={paypalSdkUrl(settings, settings.advancedCardEnabled ? ["buttons", "card-fields"] : ["buttons"])}
      title={settings.title}
      advancedCardEnabled={settings.advancedCardEnabled && Boolean(paypalClientId(settings))}
    />
  );
}
