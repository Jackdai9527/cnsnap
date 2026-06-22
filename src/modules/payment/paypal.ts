import { Prisma } from "@prisma/client";
import { ensureOrderNotExpired } from "@/lib/account/order-cancellation";
import { money, roundMoney } from "@/lib/currency";
import { prisma } from "@/lib/db";
import { syncOrderFromPayment } from "@/lib/order-status-sync";
import { sendOrderPaidEmail, sendShippingPaymentPaidEmail } from "@/lib/order-email";

export const paypalProvider = "paypal_checkout";

export type PayPalMode = "sandbox" | "live";

export type PayPalSettings = {
  enabled: boolean;
  title: string;
  mode: PayPalMode;
  sandboxClientId: string;
  sandboxClientSecret: string;
  liveClientId: string;
  liveClientSecret: string;
  advancedCardEnabled: boolean;
  brandName: string;
  currency: string;
  webhookId: string;
};

export const paypalSettingKeys = [
  "paypal_enabled",
  "paypal_title",
  "paypal_mode",
  "paypal_sandbox_client_id",
  "paypal_sandbox_client_secret",
  "paypal_live_client_id",
  "paypal_live_client_secret",
  "paypal_advanced_card_enabled",
  "paypal_brand_name",
  "paypal_currency",
  "paypal_webhook_id"
] as const;

export const paypalDefaults = {
  enabled: "false",
  title: "PayPal Checkout",
  mode: "sandbox",
  sandboxClientId: "",
  sandboxClientSecret: "",
  liveClientId: "",
  liveClientSecret: "",
  advancedCardEnabled: "false",
  brandName: "CNSnap",
  currency: "USD",
  webhookId: ""
} as const;

type DecimalLike = Prisma.Decimal | number | string | { toString(): string };

type PayPalApiError = {
  name?: string;
  message?: string;
  details?: Array<{ issue?: string; description?: string }>;
  debug_id?: string;
};

type PayPalOrderResponse = {
  id?: string;
  status?: string;
  links?: Array<{ href: string; rel: string; method: string }>;
};

type PayPalWebhookEvent = {
  id?: string;
  event_type?: string;
  create_time?: string;
  resource_type?: string;
  summary?: string;
  resource?: Record<string, unknown> & {
    id?: string;
    status?: string;
    custom_id?: string;
    invoice_id?: string;
    supplementary_data?: {
      related_ids?: {
        order_id?: string;
        capture_id?: string;
      };
    };
    amount?: { currency_code?: string; value?: string };
  };
};

type PayPalRefundResponse = {
  id?: string;
  status?: string;
  amount?: { currency_code?: string; value?: string };
};

type PayPalWebhookVerifyResponse = {
  verification_status?: string;
};

type PayPalCaptureResponse = {
  id?: string;
  status?: string;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id?: string;
        status?: string;
        amount?: { currency_code?: string; value?: string };
      }>;
    };
  }>;
};

export async function getPayPalSettings(): Promise<PayPalSettings> {
  const settings = await prisma.setting.findMany({ where: { key: { in: [...paypalSettingKeys] } } });
  const map = new Map(settings.map((setting) => [setting.key, setting.value]));
  const rawMode = process.env.PAYPAL_MODE || map.get("paypal_mode") || paypalDefaults.mode;
  const mode: PayPalMode = rawMode === "live" ? "live" : "sandbox";

  return {
    enabled: (process.env.PAYPAL_ENABLED ?? map.get("paypal_enabled") ?? paypalDefaults.enabled) === "true",
    title: process.env.PAYPAL_TITLE || map.get("paypal_title") || paypalDefaults.title,
    mode,
    sandboxClientId: process.env.PAYPAL_SANDBOX_CLIENT_ID || map.get("paypal_sandbox_client_id") || paypalDefaults.sandboxClientId,
    sandboxClientSecret: process.env.PAYPAL_SANDBOX_CLIENT_SECRET || map.get("paypal_sandbox_client_secret") || paypalDefaults.sandboxClientSecret,
    liveClientId: process.env.PAYPAL_LIVE_CLIENT_ID || map.get("paypal_live_client_id") || paypalDefaults.liveClientId,
    liveClientSecret: process.env.PAYPAL_LIVE_CLIENT_SECRET || map.get("paypal_live_client_secret") || paypalDefaults.liveClientSecret,
    advancedCardEnabled: (process.env.PAYPAL_ADVANCED_CARD_ENABLED ?? map.get("paypal_advanced_card_enabled") ?? paypalDefaults.advancedCardEnabled) === "true",
    brandName: process.env.PAYPAL_BRAND_NAME || map.get("paypal_brand_name") || paypalDefaults.brandName,
    currency: (process.env.PAYPAL_CURRENCY || map.get("paypal_currency") || paypalDefaults.currency).toUpperCase(),
    webhookId: process.env.PAYPAL_WEBHOOK_ID || map.get("paypal_webhook_id") || paypalDefaults.webhookId
  };
}

export function paypalClientId(settings: PayPalSettings) {
  return settings.mode === "live" ? settings.liveClientId : settings.sandboxClientId;
}

function paypalClientSecret(settings: PayPalSettings) {
  return settings.mode === "live" ? settings.liveClientSecret : settings.sandboxClientSecret;
}

export function paypalReady(settings: PayPalSettings) {
  return settings.enabled && Boolean(paypalClientId(settings) && paypalClientSecret(settings));
}

export function paypalWebhookReady(settings: PayPalSettings) {
  return paypalReady(settings) && Boolean(settings.webhookId);
}

export function paypalApiBase(settings: Pick<PayPalSettings, "mode">) {
  return settings.mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

export function paypalSdkUrl(settings: PayPalSettings, components: string[] = ["buttons"]) {
  const params = new URLSearchParams({
    "client-id": paypalClientId(settings),
    currency: settings.currency || "USD",
    intent: "capture",
    components: components.join(",")
  });
  return `https://www.paypal.com/sdk/js?${params.toString()}`;
}

function paymentNo(prefix = "PPL") {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`;
}

function providerOrderNo(prefix: string, id: number) {
  return `${prefix}-${id}-${Date.now()}-${Math.floor(Math.random() * 900000 + 100000)}`;
}

function payableUsd(order: { unpaidUsd: DecimalLike; totalUsd: DecimalLike; paidUsd: DecimalLike }) {
  const unpaid = Number(order.unpaidUsd);
  if (unpaid > 0) return roundMoney(unpaid);
  return roundMoney(Math.max(Number(order.totalUsd) - Number(order.paidUsd), 0));
}

function jsonObject<T extends Record<string, unknown>>(value: T) {
  return value as Prisma.InputJsonObject;
}

function paypalErrorMessage(payload: PayPalApiError, fallback: string) {
  const detail = payload.details?.find((item) => item.description || item.issue);
  return detail?.description || detail?.issue || payload.message || payload.name || fallback;
}

async function paypalAccessToken(settings: PayPalSettings) {
  const secret = paypalClientSecret(settings);
  const response = await fetch(`${paypalApiBase(settings)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${paypalClientId(settings)}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    cache: "no-store"
  });
  const payload = await response.json() as { access_token?: string } & PayPalApiError;
  if (!response.ok || !payload.access_token) {
    throw new Error(paypalErrorMessage(payload, "PayPal authentication failed."));
  }
  return payload.access_token;
}

async function paypalRequest<T>(settings: PayPalSettings, path: string, body?: Record<string, unknown>) {
  const token = await paypalAccessToken(settings);
  const response = await fetch(`${paypalApiBase(settings)}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store"
  });
  const payload = await response.json() as T & PayPalApiError;
  if (!response.ok) {
    throw new Error(paypalErrorMessage(payload, "PayPal request failed."));
  }
  return payload;
}

async function paypalRequestWithMethod<T>(settings: PayPalSettings, path: string, method: "GET" | "POST", body?: Record<string, unknown>) {
  const token = await paypalAccessToken(settings);
  const response = await fetch(`${paypalApiBase(settings)}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store"
  });
  const payload = await response.json() as T & PayPalApiError;
  if (!response.ok) {
    throw new Error(paypalErrorMessage(payload, "PayPal request failed."));
  }
  return payload;
}

async function createPayPalGatewayOrder({
  amount,
  currency,
  providerNo,
  description,
  settings,
  userEmail
}: {
  amount: number;
  currency: string;
  providerNo: string;
  description: string;
  settings: PayPalSettings;
  userEmail?: string | null;
}) {
  const requestPayload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: providerNo,
        custom_id: providerNo,
        invoice_id: providerNo,
        description: description.slice(0, 127),
        amount: {
          currency_code: currency,
          value: amount.toFixed(2)
        }
      }
    ],
    application_context: {
      brand_name: settings.brandName || "CNSnap",
      shipping_preference: "NO_SHIPPING",
      user_action: "PAY_NOW"
    },
    payer: userEmail ? { email_address: userEmail } : undefined
  };

  const response = await paypalRequest<PayPalOrderResponse>(settings, "/v2/checkout/orders", requestPayload);
  if (!response.id) {
    throw new Error("PayPal did not return an order id.");
  }
  return { requestPayload, response };
}

export async function createPayPalPayment(orderId: number, packageId?: number) {
  const settings = await getPayPalSettings();
  if (!paypalReady(settings)) {
    throw new Error("PayPal Checkout is not configured or enabled.");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: true, packages: true, payments: { orderBy: { createdAt: "desc" } } }
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

  const amountUsd = isPackagePayment ? roundMoney(Number(targetPackage?.shippingFeeUsd ?? 0)) : payableUsd(order);
  if (amountUsd <= 0) throw new Error("Order has no payable amount.");

  const providerNo = providerOrderNo("PAYPAL", order.id);
  const currency = settings.currency || "USD";
  const payment = await prisma.payment.create({
    data: {
      paymentNo: paymentNo(),
      provider: paypalProvider,
      providerOrderNo: providerNo,
      type: isPackagePayment ? "shipping" : "product",
      userId: order.userId,
      orderId: order.id,
      packageId: targetPackage?.id,
      amount: amountUsd,
      currency,
      status: "pending",
      paymentMethod: settings.title,
      requestPayload: jsonObject({
        gateway: paypalProvider,
        orderNo: order.orderNo,
        packageId: targetPackage?.id,
        amountUsd,
        currency,
        items: order.items.map((item) => ({
          title: item.title,
          sku: item.skuId || item.skuText || "",
          quantity: item.quantity,
          priceUsd: Number(item.priceUsd)
        }))
      })
    }
  });

  try {
    const gateway = await createPayPalGatewayOrder({
      amount: amountUsd,
      currency,
      providerNo,
      description: `Order ${order.orderNo}`,
      settings,
      userEmail: order.user.email
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        gatewayOrderNo: gateway.response.id,
        status: "processing",
        requestPayload: jsonObject(gateway.requestPayload),
        responsePayload: jsonObject(gateway.response as Record<string, unknown>)
      }
    });

    return { paymentId: payment.id, paypalOrderId: gateway.response.id };
  } catch (error) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "failed",
        failedAt: new Date(),
        responsePayload: jsonObject({ error: error instanceof Error ? error.message : "PayPal order creation failed." })
      }
    });
    throw error;
  }
}

export async function createPayPalWalletRecharge(userId: number, amountUsd: number) {
  const amount = roundMoney(amountUsd);
  if (amount <= 0) throw new Error("Recharge amount must be greater than zero.");

  const settings = await getPayPalSettings();
  if (!paypalReady(settings)) {
    throw new Error("PayPal Checkout is not configured or enabled.");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found.");

  const providerNo = providerOrderNo("PAYPAL-WALLET", user.id);
  const currency = settings.currency || "USD";
  const payment = await prisma.payment.create({
    data: {
      paymentNo: paymentNo("PPW"),
      provider: paypalProvider,
      providerOrderNo: providerNo,
      type: "wallet_recharge",
      userId: user.id,
      amount,
      currency,
      status: "pending",
      paymentMethod: settings.title,
      requestPayload: jsonObject({
        gateway: paypalProvider,
        source: "wallet",
        amount,
        currency,
        submittedBy: user.email
      })
    }
  });

  try {
    const gateway = await createPayPalGatewayOrder({
      amount,
      currency,
      providerNo,
      description: "Wallet recharge",
      settings,
      userEmail: user.email
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        gatewayOrderNo: gateway.response.id,
        status: "processing",
        requestPayload: jsonObject(gateway.requestPayload),
        responsePayload: jsonObject(gateway.response as Record<string, unknown>)
      }
    });

    return { paymentId: payment.id, paypalOrderId: gateway.response.id };
  } catch (error) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "failed",
        failedAt: new Date(),
        responsePayload: jsonObject({ error: error instanceof Error ? error.message : "PayPal recharge creation failed." })
      }
    });
    throw error;
  }
}

export async function capturePayPalPayment(paypalOrderId: string, userId?: number) {
  const settings = await getPayPalSettings();
  if (!paypalReady(settings)) {
    throw new Error("PayPal Checkout is not configured or enabled.");
  }

  const payment = await prisma.payment.findFirst({
    where: { provider: paypalProvider, gatewayOrderNo: paypalOrderId },
    include: { order: true, user: true }
  });
  if (!payment) throw new Error("Payment not found.");
  if (userId && payment.userId !== userId) throw new Error("Payment does not belong to the current user.");
  if (payment.status === "paid") {
    return { status: "paid", type: payment.type, orderId: payment.orderId, paymentId: payment.id };
  }
  if (payment.status === "refunded") {
    return { status: "refunded", type: payment.type, orderId: payment.orderId, paymentId: payment.id };
  }

  const capture = await paypalRequest<PayPalCaptureResponse>(settings, `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {});
  const captureRecord = capture.purchase_units?.flatMap((unit) => unit.payments?.captures || [])[0];
  const success = capture.status === "COMPLETED" || captureRecord?.status === "COMPLETED";
  const capturedAmount = roundMoney(Number(captureRecord?.amount?.value || payment.amount));
  const paidAt = new Date();

  if (!success) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: capture.status === "VOIDED" ? "failed" : "processing",
        callbackPayload: jsonObject(capture as Record<string, unknown>),
        failedAt: capture.status === "VOIDED" ? new Date() : null
      }
    });
    return { status: "processing", type: payment.type, orderId: payment.orderId, paymentId: payment.id };
  }

  if (payment.type === "wallet_recharge") {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: payment.userId } });
      const balanceAfter = roundMoney(Number(user.walletBalance) + capturedAmount);
      await tx.user.update({
        where: { id: payment.userId },
        data: { walletBalance: balanceAfter }
      });
      await tx.walletTransaction.create({
        data: {
          userId: payment.userId,
          type: "recharge",
          amount: capturedAmount,
          currency: payment.currency,
          balanceAfter,
          note: `PayPal wallet recharge ${captureRecord?.id || paypalOrderId}`
        }
      });
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "paid",
          gatewayOrderNo: paypalOrderId,
          paymentMethod: "PayPal Checkout",
          callbackPayload: jsonObject(capture as Record<string, unknown>),
          paidAt
        }
      });
    });
    return { status: "paid", type: payment.type, paymentId: payment.id };
  }

  if (!payment.orderId || !payment.order) throw new Error("Payment is not linked to an order.");
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
          gatewayOrderNo: paypalOrderId,
          paymentMethod: "PayPal Checkout",
          callbackPayload: jsonObject(capture as Record<string, unknown>),
          paidAt
        }
      });
      const user = await tx.user.findUniqueOrThrow({ where: { id: payment.userId } });
      await tx.walletTransaction.create({
        data: {
          userId: payment.userId,
          type: "pay_shipping",
          amount: -capturedAmount,
          currency: payment.currency,
          balanceAfter: user.walletBalance,
          relatedOrderId: targetOrderId,
          relatedPackageId: payment.packageId,
          note: `PayPal shipping fee ${captureRecord?.id || paypalOrderId}`
        }
      });
    });
    await syncOrderFromPayment(payment.id, {
      paidAt,
      actorId: payment.userId,
      gatewayLabel: "PayPal",
      gatewayRef: captureRecord?.id || paypalOrderId
    });
    void sendShippingPaymentPaidEmail(targetOrderId, payment.packageId ?? undefined).catch(() => undefined);
    return { status: "paid", type: payment.type, orderId: payment.orderId, packageId: payment.packageId, paymentId: payment.id };
  }

  const paidTotal = roundMoney(Number(payment.order.paidUsd) + capturedAmount);
  const unpaidTotal = roundMoney(Math.max(Number(payment.order.totalUsd) - paidTotal, 0));
  const isFullyPaid = unpaidTotal <= 0.01;

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "paid",
      gatewayOrderNo: paypalOrderId,
      paymentMethod: "PayPal Checkout",
      callbackPayload: jsonObject(capture as Record<string, unknown>),
      paidAt
    }
  });

  await syncOrderFromPayment(payment.id, {
    paidAt,
    actorId: payment.userId,
    gatewayLabel: "PayPal Checkout",
    gatewayRef: captureRecord?.id || paypalOrderId
  });

  if (isFullyPaid) {
    void sendOrderPaidEmail(payment.orderId).catch(() => undefined);
  }

  return { status: "paid", type: payment.type, orderId: payment.orderId, paymentId: payment.id };
}

export async function syncPayPalWebhook(event: PayPalWebhookEvent) {
  const resource = event.resource ?? {};
  const gatewayOrderNo = String(resource.supplementary_data?.related_ids?.order_id || resource.id || "");
  if (!gatewayOrderNo) {
    return { ok: true, ignored: true };
  }

  const payment = await prisma.payment.findFirst({
    where: {
      OR: [{ gatewayOrderNo }, { providerOrderNo: String(resource.custom_id || resource.invoice_id || "") }]
    },
    include: { order: true }
  });

  if (!payment) {
    return { ok: true, ignored: true };
  }

  const eventType = String(event.event_type || "");
  const status = String(resource.status || "");

  if (["PAYMENT.CAPTURE.COMPLETED", "CHECKOUT.ORDER.APPROVED", "CHECKOUT.ORDER.COMPLETED"].includes(eventType) || status === "COMPLETED") {
    if (payment.status !== "paid") {
      await capturePayPalPayment(payment.gatewayOrderNo || gatewayOrderNo);
    }
  } else if (["PAYMENT.CAPTURE.DENIED", "PAYMENT.CAPTURE.DECLINED"].includes(eventType)) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "failed",
        failedAt: new Date(),
        callbackPayload: jsonObject(event as unknown as Record<string, unknown>)
      }
    });
  } else {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        callbackPayload: jsonObject(event as unknown as Record<string, unknown>)
      }
    });
  }

  return { ok: true };
}

export async function refundPayPalPayment(paymentId: number, amount?: number) {
  const settings = await getPayPalSettings();
  if (!paypalReady(settings)) {
    throw new Error("PayPal Checkout is not configured or enabled.");
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: true }
  });
  if (!payment) throw new Error("Payment not found.");
  if (payment.provider !== paypalProvider) throw new Error("Payment is not a PayPal payment.");
  const existingRefund = payment.responsePayload as { id?: string; status?: string } | null;
  if (payment.status === "refunded") {
    return {
      paymentId: payment.id,
      refundId: existingRefund?.id,
      status: existingRefund?.status || "COMPLETED",
      amount: Number(payment.amount)
    };
  }
  if (payment.status !== "paid") throw new Error("Only paid payments can be refunded.");

  const callback = payment.callbackPayload as { purchase_units?: Array<{ payments?: { captures?: Array<{ id?: string }> } }> } | null;
  const captureId = callback?.purchase_units?.flatMap((unit) => unit.payments?.captures || [])[0]?.id;
  if (!captureId) {
    throw new Error("PayPal capture id not found for refund.");
  }

  const refundAmount = amount && amount > 0 ? roundMoney(amount) : roundMoney(Number(payment.amount));
  if (refundAmount <= 0) throw new Error("Refund amount must be greater than zero.");
  if (refundAmount > Number(payment.amount)) throw new Error("Refund amount exceeds original payment.");

  const response = await paypalRequestWithMethod<PayPalRefundResponse>(
    settings,
    `/v2/payments/captures/${encodeURIComponent(captureId)}/refund`,
    "POST",
    { amount: { currency_code: payment.currency, value: refundAmount.toFixed(2) } }
  );

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: response.status === "COMPLETED" ? "refunded" : payment.status,
      responsePayload: jsonObject(response as unknown as Record<string, unknown>)
    }
  });

  if (payment.orderId && payment.order) {
    const nextRefundUsd = roundMoney(Number(payment.order.refundUsd) + refundAmount);
    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        refundUsd: nextRefundUsd,
        refundStatus: nextRefundUsd >= Number(payment.order.totalUsd) ? "refunded" : "partial_refunded",
        paymentStatus: nextRefundUsd >= Number(payment.order.totalUsd) ? "refunded" : payment.order.paymentStatus,
        logs: {
          create: {
            actorId: payment.userId,
            action: "payment_refunded",
            detail: `PayPal refund ${money(refundAmount, payment.currency)} (${response.id || captureId})`
          }
        }
      }
    });
  }

  return { paymentId: payment.id, refundId: response.id, status: response.status, amount: refundAmount };
}

async function paypalVerifyWebhook(settings: PayPalSettings, headers: Headers, body: Record<string, unknown>) {
  if (!settings.webhookId) return true;

  const token = await paypalAccessToken(settings);
  const baseUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const response = await fetch(`${paypalApiBase(settings)}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: settings.webhookId,
      webhook_event: body,
      webhook_event_url: `${baseUrl}/api/payments/paypal/webhook`
    }),
    cache: "no-store"
  });

  const payload = await response.json() as PayPalWebhookVerifyResponse & PayPalApiError;
  if (!response.ok) {
    throw new Error(paypalErrorMessage(payload, "PayPal webhook verification failed."));
  }
  return payload.verification_status === "SUCCESS";
}

async function hasProcessedWebhook(eventId: string) {
  const record = await prisma.setting.findUnique({ where: { key: "paypal_webhook_events" } });
  if (!record?.value) return false;
  try {
    const ids = JSON.parse(record.value) as string[];
    return ids.includes(eventId);
  } catch {
    return false;
  }
}

async function markWebhookProcessed(eventId: string) {
  const record = await prisma.setting.findUnique({ where: { key: "paypal_webhook_events" } });
  let ids: string[] = [];
  if (record?.value) {
    try {
      ids = JSON.parse(record.value) as string[];
    } catch {
      ids = [];
    }
  }
  const next = Array.from(new Set([eventId, ...ids])).slice(0, 200);
  if (record) {
    await prisma.setting.update({ where: { key: "paypal_webhook_events" }, data: { value: JSON.stringify(next) } });
  } else {
    await prisma.setting.create({
      data: {
        key: "paypal_webhook_events",
        value: JSON.stringify(next),
        label: "PayPal Webhook Events",
        description: "Processed PayPal webhook ids for idempotency"
      }
    });
  }
}

export async function verifyAndSyncPayPalWebhook(headers: Headers, body: Record<string, unknown>) {
  const settings = await getPayPalSettings();
  if (!paypalWebhookReady(settings)) {
    throw new Error("PayPal webhook is not configured or enabled.");
  }
  const eventId = String(body.id || "");
  if (!eventId) {
    throw new Error("Missing PayPal webhook event id.");
  }
  if (await hasProcessedWebhook(eventId)) {
    return { ok: true, duplicate: true };
  }

  const verified = await paypalVerifyWebhook(settings, headers, body);
  if (!verified) {
    throw new Error("PayPal webhook signature verification failed.");
  }

  const result = await syncPayPalWebhook(body as PayPalWebhookEvent);
  await markWebhookProcessed(eventId);
  return result;
}
