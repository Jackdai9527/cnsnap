import { Prisma } from "@prisma/client";
import { ensureOrderNotExpired } from "@/lib/account/order-cancellation";
import { isEuCountry } from "@/lib/countries";
import { roundMoney } from "@/lib/currency";
import { prisma } from "@/lib/db";

export const sepaProvider = "sepa_instant";

export type SepaSettings = {
  enabled: boolean;
  title: string;
  description: string;
  beneficiaryName: string;
  iban: string;
  bic: string;
  reference: string;
  bankName: string;
  bankAddress: string;
  tips: string;
  instructions: string;
  usdEurRate: number;
};

export type SepaEligibilityInput = {
  currency?: string | null;
  countryCode?: string | null;
};

type DecimalLike = Prisma.Decimal | number | string | { toString(): string };

export const sepaSettingKeys = [
  "sepa_enabled",
  "sepa_title",
  "sepa_description",
  "sepa_beneficiary_name",
  "sepa_iban",
  "sepa_bic",
  "sepa_reference",
  "sepa_bank_name",
  "sepa_bank_address",
  "sepa_tips",
  "sepa_instructions",
  "sepa_usd_eur_rate"
] as const;

export const sepaDefaults = {
  enabled: "false",
  title: "SEPA Instant Payments",
  description: "<p>Transfer the payable amount in EUR to our SEPA account, then submit your bank account holder name and the last four characters of the transaction reference.</p>",
  beneficiaryName: "",
  iban: "",
  bic: "",
  reference: "CNSNAP-{orderNo}",
  bankName: "",
  bankAddress: "",
  tips: "After completing the transfer, please enter the last 4 characters of your transaction ID or the last 4 digits of your bank account number.",
  instructions: "<p>We will confirm your SEPA transfer within the next 12 hours after submission.</p>",
  usdEurRate: "0.92"
} as const;

export async function getSepaSettings(): Promise<SepaSettings> {
  const settings = await prisma.setting.findMany({ where: { key: { in: [...sepaSettingKeys] } } });
  const map = new Map(settings.map((setting) => [setting.key, setting.value]));

  return {
    enabled: (process.env.SEPA_ENABLED ?? map.get("sepa_enabled") ?? sepaDefaults.enabled) === "true",
    title: process.env.SEPA_TITLE || map.get("sepa_title") || sepaDefaults.title,
    description: map.get("sepa_description") || sepaDefaults.description,
    beneficiaryName: process.env.SEPA_BENEFICIARY_NAME || map.get("sepa_beneficiary_name") || sepaDefaults.beneficiaryName,
    iban: process.env.SEPA_IBAN || map.get("sepa_iban") || sepaDefaults.iban,
    bic: process.env.SEPA_BIC || map.get("sepa_bic") || sepaDefaults.bic,
    reference: map.get("sepa_reference") || sepaDefaults.reference,
    bankName: map.get("sepa_bank_name") || sepaDefaults.bankName,
    bankAddress: map.get("sepa_bank_address") || sepaDefaults.bankAddress,
    tips: map.get("sepa_tips") || sepaDefaults.tips,
    instructions: map.get("sepa_instructions") || sepaDefaults.instructions,
    usdEurRate: readPositiveRate(process.env.SEPA_USD_EUR_RATE || map.get("sepa_usd_eur_rate") || sepaDefaults.usdEurRate)
  };
}

export function sepaReady(settings: SepaSettings) {
  return settings.enabled && Boolean(settings.beneficiaryName && settings.iban && settings.bic);
}

export function isSepaEligible(input: SepaEligibilityInput) {
  const currency = input.currency?.toUpperCase();
  return currency === "EUR" || isEuCountry(input.countryCode);
}

export function sepaReference(settings: SepaSettings, orderNo: string) {
  return (settings.reference || sepaDefaults.reference).replaceAll("{orderNo}", orderNo);
}

export function payableUsd(order: { unpaidUsd: DecimalLike; totalUsd: DecimalLike; paidUsd: DecimalLike }) {
  const unpaid = Number(order.unpaidUsd);
  if (unpaid > 0) return roundMoney(unpaid);
  return roundMoney(Math.max(Number(order.totalUsd) - Number(order.paidUsd), 0));
}

export function payableEur(amountUsd: number, settings: Pick<SepaSettings, "usdEurRate">) {
  return roundMoney(amountUsd * settings.usdEurRate);
}

function readPositiveRate(value: string) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : Number(sepaDefaults.usdEurRate);
}

function paymentNo() {
  return `SEP${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`;
}

function providerOrderNo(orderId: number) {
  return `SEPA-${orderId}-${Date.now()}`;
}

function jsonObject<T extends Record<string, unknown>>(value: T) {
  return value as Prisma.InputJsonObject;
}

export async function createSepaPayment({
  orderId,
  packageId,
  holderName,
  transactionReference
}: {
  orderId: number;
  packageId?: number;
  holderName: string;
  transactionReference: string;
}) {
  const name = holderName.trim();
  const referenceTail = transactionReference.trim();
  if (name.length < 2) {
    throw new Error("Please enter a valid bank account holder name.");
  }
  if (referenceTail.length !== 4) {
    throw new Error("Transaction reference must be exactly 4 characters.");
  }

  const settings = await getSepaSettings();
  if (!sepaReady(settings)) {
    throw new Error("SEPA Instant Payments is not configured or enabled.");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, address: true, items: true, packages: true, payments: { orderBy: { createdAt: "desc" } } }
  });
  if (!order) throw new Error("Order not found.");
  await ensureOrderNotExpired(order.id, order.userId);
  let targetPackage = packageId ? order.packages.find((pkg) => pkg.id === packageId) : undefined;
  if (packageId && !targetPackage) {
    const bridgedPayment = order.payments.find((payment) => payment.packageId === packageId);
    if (bridgedPayment?.packageId) {
      targetPackage = await prisma.package.findUnique({ where: { id: bridgedPayment.packageId } }) ?? undefined;
    }
  }
  const isPackagePayment = Boolean(targetPackage);
  if (!isPackagePayment && order.paymentStatus === "paid") throw new Error("Order is already paid.");
  if (packageId && !targetPackage) throw new Error("Package not found for this order.");

  const countryCode = order.address?.country || order.destinationCountryCode || order.destinationCountry;
  if (!isSepaEligible({ currency: order.currency, countryCode })) {
    throw new Error("SEPA Instant Payments is only available for EU addresses or EUR orders.");
  }

  const amountUsd = isPackagePayment ? roundMoney(Number(targetPackage?.shippingFeeUsd ?? 0)) : payableUsd(order);
  if (amountUsd <= 0) throw new Error("Order has no payable amount.");

  const amountEur = order.currency.toUpperCase() === "EUR" ? amountUsd : payableEur(amountUsd, settings);
  const fullReference = sepaReference(settings, order.orderNo);
  const providerNo = providerOrderNo(order.id);

  const requestPayload = {
    gateway: sepaProvider,
    orderNo: order.orderNo,
    sourceCurrency: order.currency || "USD",
    sourceAmountUsd: amountUsd,
    amountEur,
    usdEurRate: settings.usdEurRate,
    paymentReference: fullReference,
    holderName: name,
    transactionReference: referenceTail,
    bankDetails: {
      beneficiaryName: settings.beneficiaryName,
      iban: settings.iban,
      bic: settings.bic,
      bankName: settings.bankName,
      bankAddress: settings.bankAddress
    }
  };

  const payment = await prisma.$transaction(async (tx) => {
    const created = await tx.payment.create({
      data: {
        paymentNo: paymentNo(),
        provider: sepaProvider,
        providerOrderNo: providerNo,
        type: isPackagePayment ? "shipping" : "product",
        userId: order.userId,
        orderId: order.id,
        packageId: targetPackage?.id,
        amount: amountEur,
        currency: "EUR",
        status: "awaiting_transfer",
        paymentMethod: "SEPA Instant",
        requestPayload: jsonObject(requestPayload)
      }
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        orderStatus: "pending_payment",
        status: "pending_payment",
        logs: {
          create: {
            actorId: order.userId,
            action: "sepa_transfer_submitted",
            detail: `SEPA transfer submitted for EUR ${amountEur.toFixed(2)} (${providerNo})`
          }
        }
      }
    });

    return created;
  });

  return payment;
}
