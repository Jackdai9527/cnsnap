import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { ensureOrderNotExpired } from "@/lib/account/order-cancellation";
import { prisma } from "@/lib/db";
import { roundMoney } from "@/lib/currency";
import { syncOrderFromPayment } from "@/lib/order-status-sync";
import { sendOrderPaidEmail, sendShippingPaymentPaidEmail } from "@/lib/order-email";

type OnlyPaySettings = {
  enabled: boolean;
  title: string;
  mchId: string;
  appId: string;
  signKey: string;
  submitUrl: string;
  productId: string;
};

type OnlyPayCallback = Record<string, string>;

const onlyPaySettingKeys = [
  "onlypay_enabled",
  "onlypay_title",
  "onlypay_mch_id",
  "onlypay_app_id",
  "onlypay_sign_key",
  "onlypay_submit_url",
  "onlypay_product_id"
];

export async function getOnlyPaySettings(): Promise<OnlyPaySettings> {
  const settings = await prisma.setting.findMany({ where: { key: { in: onlyPaySettingKeys } } });
  const map = new Map(settings.map((setting) => [setting.key, setting.value]));
  return {
    enabled: (process.env.ONLYPAY_ENABLED ?? map.get("onlypay_enabled") ?? "false") === "true",
    title: process.env.ONLYPAY_TITLE || map.get("onlypay_title") || "Credit Card / Wallet Payment",
    mchId: process.env.ONLYPAY_MCH_ID || map.get("onlypay_mch_id") || "",
    appId: process.env.ONLYPAY_APP_ID || map.get("onlypay_app_id") || "",
    signKey: process.env.ONLYPAY_SIGN_KEY || map.get("onlypay_sign_key") || "",
    submitUrl: process.env.ONLYPAY_SUBMIT_URL || map.get("onlypay_submit_url") || "https://international.storepay.cn/api/pay/create_order",
    productId: process.env.ONLYPAY_PRODUCT_ID || map.get("onlypay_product_id") || "8000"
  };
}

export function onlyPayReady(settings: OnlyPaySettings) {
  return settings.enabled && Boolean(settings.mchId && settings.appId && settings.signKey && settings.submitUrl);
}

function appUrl() {
  return process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
}

function md5Upper(input: string) {
  return crypto.createHash("md5").update(input, "utf8").digest("hex").toUpperCase();
}

export function signOnlyPayRequest(data: Record<string, string | number>, signKey: string) {
  const params = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join("&");
  return md5Upper(`${params}&key=${signKey}`);
}

export function signOnlyPayCallback(data: Record<string, string>, signKey: string) {
  const pieces = Object.entries(data)
    .filter(([key, value]) => key !== "sign" && key !== "sign_type" && value !== "")
    .map(([key, value]) => `${key}=${value}&`)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "accent" }));
  return md5Upper(`${pieces.join("")}key=${signKey}`);
}

function paymentNo() {
  return `PAY${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`;
}

function jsonObject<T extends Record<string, unknown>>(value: T) {
  return value as Prisma.InputJsonObject;
}

function providerOrderNo(orderId: number) {
  return `${orderId}_${Math.floor(Math.random() * 900000 + 100000)}`;
}

function walletProviderOrderNo(userId: number) {
  return `WALLET-${userId}-${Date.now()}-${Math.floor(Math.random() * 900000 + 100000)}`;
}

function paymentAmount(order: { unpaidUsd: Prisma.Decimal; totalUsd: Prisma.Decimal; paidUsd: Prisma.Decimal }) {
  const unpaid = Number(order.unpaidUsd);
  if (unpaid > 0) return roundMoney(unpaid);
  return roundMoney(Math.max(Number(order.totalUsd) - Number(order.paidUsd), 0));
}

function parseOnlyPayTime(value?: string) {
  if (!value) return new Date();
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return new Date();
  return new Date(numeric < 10_000_000_000 ? numeric * 1000 : numeric);
}

export async function createOnlyPayOrder(orderId: number, packageId?: number) {
  const settings = await getOnlyPaySettings();
  if (!onlyPayReady(settings)) {
    throw new Error("ONLYPAY is not configured or enabled.");
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

  const amountUsd = isPackagePayment ? roundMoney(Number(targetPackage?.shippingFeeUsd ?? 0)) : paymentAmount(order);
  if (amountUsd <= 0) throw new Error("Order has no payable amount.");

  const mchOrderNo = providerOrderNo(order.id);
  const baseUrl = appUrl();
  const extra = {
    email: order.user.email,
    shippingFirstName: order.address?.contactName || order.user.name || order.user.email,
    shippingLastName: "",
    shippingAddress: [order.address?.line1, order.address?.line2].filter(Boolean).join(" "),
    shippingCity: order.address?.city || "",
    shippingState: order.address?.state || "",
    shippingCountry: order.address?.country || order.destinationCountryCode || "",
    shippingZipCode: order.address?.postalCode || "",
    shippingPhone: order.address?.phone || "",
    billingFirstName: order.address?.contactName || order.user.name || order.user.email,
    billingLastName: "",
    billingAddress: [order.address?.line1, order.address?.line2].filter(Boolean).join(" "),
    billingCity: order.address?.city || "",
    billingState: order.address?.state || "",
    billingCountry: order.address?.country || order.destinationCountryCode || "",
    billingZipCode: order.address?.postalCode || "",
    billingPhone: order.address?.phone || ""
  };
  const goodsInfo = order.items.map((item) => ({
    name: item.title,
    sku: item.skuId || item.skuText || "",
    unitPrice: Number(item.priceUsd),
    quantity: item.quantity
  }));

  const requestPayload = {
    mchId: settings.mchId,
    appId: settings.appId,
    productId: settings.productId,
    mchOrderNo,
    currency: order.currency || "USD",
    amount: Math.round(amountUsd * 100),
    returnUrl: `${baseUrl}/payment/onlypay/return`,
    notifyUrl: `${baseUrl}/api/payments/onlypay/notify`,
    items: JSON.stringify(goodsInfo),
    extra: JSON.stringify(extra)
  };
  const sign = signOnlyPayRequest(requestPayload, settings.signKey);
  const signedPayload = { ...requestPayload, sign };

  const payment = await prisma.payment.create({
    data: {
      paymentNo: paymentNo(),
      provider: "onlypay",
      providerOrderNo: mchOrderNo,
      type: isPackagePayment ? "shipping" : "product",
      userId: order.userId,
      orderId: order.id,
      packageId: targetPackage?.id,
      amount: amountUsd,
      currency: order.currency || "USD",
      status: "pending",
      requestPayload: jsonObject(signedPayload)
    }
  });

  const response = await fetch(settings.submitUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: baseUrl
    },
    body: `params=${encodeURIComponent(JSON.stringify(signedPayload))}`,
    redirect: "manual"
  });
  const text = await response.text();
  let responsePayload: Record<string, unknown>;
  try {
    responsePayload = JSON.parse(text) as Record<string, unknown>;
  } catch {
    responsePayload = { raw: text };
  }

  const payParams = responsePayload.payParams as { payUrl?: string; payType?: string } | undefined;
  const redirectUrl = responsePayload.retCode === "SUCCESS" && payParams?.payUrl ? payParams.payUrl : null;

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      responsePayload: jsonObject(responsePayload),
      redirectUrl,
      status: redirectUrl ? "redirected" : "failed",
      failedAt: redirectUrl ? null : new Date()
    }
  });

  if (!redirectUrl) {
    const message = typeof responsePayload.retMsg === "string" ? responsePayload.retMsg : "ONLYPAY did not return a pay URL.";
    throw new Error(message);
  }

  return { paymentId: payment.id, redirectUrl };
}

export async function createOnlyPayWalletRecharge(userId: number, amountUsd: number) {
  const amount = roundMoney(amountUsd);
  if (amount <= 0) throw new Error("Recharge amount must be greater than zero.");

  const settings = await getOnlyPaySettings();
  if (!onlyPayReady(settings)) {
    throw new Error("ONLYPAY is not configured or enabled.");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found.");

  const mchOrderNo = walletProviderOrderNo(user.id);
  const baseUrl = appUrl();
  const requestPayload = {
    mchId: settings.mchId,
    appId: settings.appId,
    productId: settings.productId,
    mchOrderNo,
    currency: "USD",
    amount: Math.round(amount * 100),
    returnUrl: `${baseUrl}/account/wallet?payment=onlypay`,
    notifyUrl: `${baseUrl}/api/payments/onlypay/notify`,
    items: JSON.stringify([{ name: "Wallet recharge", sku: "wallet-recharge", unitPrice: amount, quantity: 1 }]),
    extra: JSON.stringify({
      email: user.email,
      billingFirstName: user.name || user.email,
      billingLastName: "",
      billingAddress: "",
      billingCity: "",
      billingState: "",
      billingCountry: "",
      billingZipCode: "",
      billingPhone: ""
    })
  };
  const sign = signOnlyPayRequest(requestPayload, settings.signKey);
  const signedPayload = { ...requestPayload, sign };

  const payment = await prisma.payment.create({
    data: {
      paymentNo: paymentNo(),
      provider: "onlypay",
      providerOrderNo: mchOrderNo,
      type: "wallet_recharge",
      userId: user.id,
      amount,
      currency: "USD",
      status: "pending",
      paymentMethod: settings.title,
      requestPayload: jsonObject(signedPayload)
    }
  });

  const response = await fetch(settings.submitUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: baseUrl
    },
    body: `params=${encodeURIComponent(JSON.stringify(signedPayload))}`,
    redirect: "manual"
  });
  const text = await response.text();
  let responsePayload: Record<string, unknown>;
  try {
    responsePayload = JSON.parse(text) as Record<string, unknown>;
  } catch {
    responsePayload = { raw: text };
  }

  const payParams = responsePayload.payParams as { payUrl?: string; payType?: string } | undefined;
  const redirectUrl = responsePayload.retCode === "SUCCESS" && payParams?.payUrl ? payParams.payUrl : null;

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      responsePayload: jsonObject(responsePayload),
      redirectUrl,
      status: redirectUrl ? "redirected" : "failed",
      failedAt: redirectUrl ? null : new Date()
    }
  });

  if (!redirectUrl) {
    const message = typeof responsePayload.retMsg === "string" ? responsePayload.retMsg : "ONLYPAY did not return a pay URL.";
    throw new Error(message);
  }

  return { paymentId: payment.id, redirectUrl };
}

function callbackDataFromEntries(entries: Iterable<[string, string]>) {
  const data: OnlyPayCallback = {};
  for (const [key, value] of entries) data[key] = value;
  return data;
}

export async function parseOnlyPayCallback(request: Request) {
  if (request.method === "POST") {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await request.json();
      return Object.fromEntries(Object.entries(json).map(([key, value]) => [key, String(value ?? "")]));
    }
    const form = await request.formData();
    return callbackDataFromEntries(Array.from(form.entries()).map(([key, value]) => [key, String(value)]));
  }
  return callbackDataFromEntries(new URL(request.url).searchParams.entries());
}

export async function handleOnlyPayCallback(data: OnlyPayCallback) {
  const settings = await getOnlyPaySettings();
  if (!settings.signKey) throw new Error("ONLYPAY sign key is not configured.");

  const receivedSign = data.sign || "";
  const calculatedSign = signOnlyPayCallback(data, settings.signKey);
  if (receivedSign !== calculatedSign) {
    throw new Error("Invalid ONLYPAY signature.");
  }

  const payment = await prisma.payment.findFirst({
    where: { provider: "onlypay", providerOrderNo: data.mchOrderNo },
    include: { order: true }
  });
  if (!payment) throw new Error("Payment not found.");

  const success = data.status === "2" || data.status === "3";
  const failed = data.status === "-1" || data.status === "-2" || data.status === "1";
  const gatewayAmount = Number(data.amount || 0) / 100;
  const amount = gatewayAmount > 0 ? roundMoney(gatewayAmount) : Number(payment.amount);
  const wasAlreadyPaid = payment.status === "paid";

  if (success) {
    if (payment.type === "wallet_recharge") {
      if (payment.status === "paid") {
        return { status: "paid" };
      }

      const paidAt = parseOnlyPayTime(data.paySuccTime);
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUniqueOrThrow({ where: { id: payment.userId } });
        const balanceAfter = roundMoney(Number(user.walletBalance) + amount);
        await tx.user.update({
          where: { id: payment.userId },
          data: { walletBalance: balanceAfter }
        });
        await tx.walletTransaction.create({
          data: {
            userId: payment.userId,
            type: "recharge",
            amount,
            currency: payment.currency || "USD",
            balanceAfter,
            note: `ONLYPAY wallet recharge ${data.payOrderId || data.mchOrderNo}`
          }
        });
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "paid",
            gatewayOrderNo: data.payOrderId || payment.gatewayOrderNo,
            paymentMethod: data.paymentMethod || payment.paymentMethod,
            callbackPayload: jsonObject(data),
            paidAt
          }
        });
      });
      return { status: "paid" };
    }

    if (!payment.orderId) throw new Error("Payment is not linked to an order.");
    const paidAt = parseOnlyPayTime(data.paySuccTime);
    if (payment.type === "shipping" && payment.packageId) {
      let targetOrderId = payment.orderId!;
      await prisma.$transaction(async (tx) => {
        const pkg = await tx.package.findUniqueOrThrow({
          where: { id: payment.packageId! },
          select: { id: true, orderId: true }
        });
        targetOrderId = pkg.orderId ?? payment.orderId!;

        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "paid",
            gatewayOrderNo: data.payOrderId || payment.gatewayOrderNo,
            paymentMethod: data.paymentMethod || payment.paymentMethod,
            callbackPayload: jsonObject(data),
            paidAt
          }
        });
        const user = await tx.user.findUniqueOrThrow({ where: { id: payment.userId } });
        await tx.walletTransaction.create({
          data: {
            userId: payment.userId,
            type: "pay_shipping",
            amount: -amount,
            currency: payment.currency || "USD",
            balanceAfter: user.walletBalance,
            relatedOrderId: targetOrderId,
            relatedPackageId: payment.packageId,
            note: `ONLYPAY shipping fee ${data.payOrderId || data.mchOrderNo}`
          }
        });
      });
      await syncOrderFromPayment(payment.id, {
        paidAt,
        actorId: payment.userId,
        gatewayLabel: "ONLYPAY",
        gatewayRef: data.payOrderId || data.mchOrderNo
      });
      void sendShippingPaymentPaidEmail(targetOrderId, payment.packageId ?? undefined).catch(() => undefined);
      return { status: "paid" };
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "paid",
        gatewayOrderNo: data.payOrderId || payment.gatewayOrderNo,
        paymentMethod: data.paymentMethod || payment.paymentMethod,
        callbackPayload: jsonObject(data),
        paidAt
      }
    });
    await syncOrderFromPayment(payment.id, {
      paidAt,
      actorId: payment.userId,
      gatewayLabel: "ONLYPAY",
      gatewayRef: data.payOrderId || data.mchOrderNo
    });
    if (!wasAlreadyPaid) {
      void sendOrderPaidEmail(payment.orderId).catch(() => undefined);
    }
    return { status: "paid" };
  }

  if (failed) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "failed",
        gatewayOrderNo: data.payOrderId || payment.gatewayOrderNo,
        paymentMethod: data.paymentMethod || payment.paymentMethod,
        callbackPayload: jsonObject(data),
        failedAt: new Date()
      }
    });
    if (payment.orderId) {
      await prisma.operationLog.create({
        data: { orderId: payment.orderId, action: "payment_failed", detail: `ONLYPAY failed: ${data.resultMsg || data.status}` }
      });
    }
    return { status: "failed" };
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "processing",
      gatewayOrderNo: data.payOrderId || payment.gatewayOrderNo,
      paymentMethod: data.paymentMethod || payment.paymentMethod,
      callbackPayload: jsonObject(data)
    }
  });
  return { status: "processing" };
}
