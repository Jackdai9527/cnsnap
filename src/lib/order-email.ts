import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import { money } from "@/lib/currency";
import { logger } from "@/lib/logger";

const ORDER_PAID_TEMPLATE = "order_paid";
const ORDER_QC_TEMPLATE = "order_qc_ready";
const ORDER_SHIPPING_PAYMENT_TEMPLATE = "order_shipping_payment";
const ORDER_SHIPPING_PAID_TEMPLATE = "order_shipping_paid";

type DecimalValue = { toString(): string } | number | string;

type OrderEmailRow = {
  id: number;
  orderNo: string;
  paymentStatus: string;
  currency: string;
  subtotalUsd: DecimalValue;
  serviceFeeUsd: DecimalValue;
  domesticShippingUsd: DecimalValue;
  valueAddedServicesUsd: DecimalValue;
  discountUsd: DecimalValue;
  paidUsd: DecimalValue;
  actualShippingUsd?: DecimalValue;
  createdAt: Date;
  paidAt: Date | null;
  shippingAddressSnapshot: unknown;
  user: {
    email: string;
    name: string | null;
  };
  address: {
    contactName: string;
    phone: string;
    country: string;
    state: string | null;
    city: string;
    postalCode: string;
    line1: string;
    line2: string | null;
  } | null;
  items: Array<{
    id: number;
    title: string;
    image: string;
    skuText: string | null;
    quantity: number;
    priceUsd: DecimalValue;
  }>;
  mediaAssets?: Array<{
    id: number;
    url: string;
    originalName: string;
    altText: string | null;
  }>;
  packages?: Array<{
    id: number;
    packageNo: string;
    shippingFeeUsd?: DecimalValue;
  }>;
};

type MailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
  siteName: string;
  baseUrl: string;
};

type AddressSnapshot = {
  contactName?: string;
  phone?: string;
  country?: string;
  state?: string | null;
  city?: string;
  postalCode?: string;
  line1?: string;
  line2?: string | null;
};

export async function sendOrderPaidEmail(orderId: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNo: true,
      paymentStatus: true,
      currency: true,
      subtotalUsd: true,
      serviceFeeUsd: true,
      domesticShippingUsd: true,
      valueAddedServicesUsd: true,
      discountUsd: true,
      paidUsd: true,
      actualShippingUsd: true,
      createdAt: true,
      paidAt: true,
      shippingAddressSnapshot: true,
      user: {
        select: {
          email: true,
          name: true
        }
      },
      address: {
        select: {
          contactName: true,
          phone: true,
          country: true,
          state: true,
          city: true,
          postalCode: true,
          line1: true,
          line2: true
        }
      },
      items: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          title: true,
          image: true,
          skuText: true,
          quantity: true,
          priceUsd: true
        }
      }
    }
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  if (order.paymentStatus !== "paid") {
    return { skipped: true, reason: "order_not_paid" as const };
  }

  const subject = orderPaidSubject(order.orderNo);
  const reserved = await prisma.$transaction(async (tx) => {
    const existing = await tx.emailLog.findFirst({
      where: {
        to: order.user.email,
        template: ORDER_PAID_TEMPLATE,
        subject,
        status: { in: ["queued", "sent"] }
      }
    });

    if (existing) {
      return false;
    }

    await tx.emailLog.create({
      data: {
        to: order.user.email,
        subject,
        template: ORDER_PAID_TEMPLATE,
        status: "queued"
      }
    });

    return true;
  });

  if (!reserved) {
    return { skipped: true, reason: "already_logged" as const };
  }

  const config = await getMailConfig();
  if (!config) {
    await prisma.emailLog.updateMany({
      where: {
        to: order.user.email,
        template: ORDER_PAID_TEMPLATE,
        subject,
        status: "queued"
      },
      data: {
        status: "failed",
        error: "SMTP is not configured."
      }
    });
    return { skipped: true, reason: "smtp_not_configured" as const };
  }

  const recipientName = order.user.name?.trim() || readAddress(order)?.contactName?.trim() || order.user.email.split("@")[0];
  const html = renderOrderPaidEmail(order, config, recipientName);
  const text = renderOrderPaidText(order, config, recipientName);

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user || config.pass
      ? {
          user: config.user,
          pass: config.pass
        }
      : undefined
  });

  try {
    await transporter.sendMail({
      from: formatMailbox(config.fromName, config.fromEmail),
      to: order.user.email,
      subject,
      html,
      text
    });

    await prisma.emailLog.updateMany({
      where: {
        to: order.user.email,
        template: ORDER_PAID_TEMPLATE,
        subject,
        status: "queued"
      },
      data: {
        status: "sent",
        error: null
      }
    });

    return { sent: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send order success email.";

    logger.warn(
      {
        event: "order_paid_email_failed",
        orderId: order.id,
        orderNo: order.orderNo,
        recipient: order.user.email,
        error: message
      },
      "Order paid email failed"
    );

    await prisma.emailLog.updateMany({
      where: {
        to: order.user.email,
        template: ORDER_PAID_TEMPLATE,
        subject,
        status: "queued"
      },
      data: {
        status: "failed",
        error: message
      }
    });

    return { sent: false as const, error: message };
  }
}

export async function sendOrderQcEmail(orderId: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNo: true,
      paymentStatus: true,
      currency: true,
      subtotalUsd: true,
      serviceFeeUsd: true,
      domesticShippingUsd: true,
      valueAddedServicesUsd: true,
      discountUsd: true,
      paidUsd: true,
      createdAt: true,
      paidAt: true,
      shippingAddressSnapshot: true,
      user: {
        select: {
          email: true,
          name: true
        }
      },
      address: {
        select: {
          contactName: true,
          phone: true,
          country: true,
          state: true,
          city: true,
          postalCode: true,
          line1: true,
          line2: true
        }
      },
      items: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          title: true,
          image: true,
          skuText: true,
          quantity: true,
          priceUsd: true
        }
      },
      mediaAssets: {
        where: { usage: "qc_photo" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          url: true,
          originalName: true,
          altText: true
        }
      },
      packages: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          packageNo: true,
          shippingFeeUsd: true
        }
      }
    }
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  if (!order.mediaAssets.length) {
    return { skipped: true, reason: "no_qc_photos" as const };
  }

  const subject = `QC photos ready for order ${order.orderNo}`;
  const reserved = await prisma.$transaction(async (tx) => {
    const existing = await tx.emailLog.findFirst({
      where: {
        to: order.user.email,
        template: ORDER_QC_TEMPLATE,
        subject,
        status: { in: ["queued", "sent"] }
      }
    });

    if (existing) {
      return false;
    }

    await tx.emailLog.create({
      data: {
        to: order.user.email,
        subject,
        template: ORDER_QC_TEMPLATE,
        status: "queued"
      }
    });

    return true;
  });

  if (!reserved) {
    return { skipped: true, reason: "already_logged" as const };
  }

  const config = await getMailConfig();
  if (!config) {
    await prisma.emailLog.updateMany({
      where: {
        to: order.user.email,
        template: ORDER_QC_TEMPLATE,
        subject,
        status: "queued"
      },
      data: {
        status: "failed",
        error: "SMTP is not configured."
      }
    });
    return { skipped: true, reason: "smtp_not_configured" as const };
  }

  const recipientName = order.user.name?.trim() || readAddress(order)?.contactName?.trim() || order.user.email.split("@")[0];
  const html = renderOrderQcEmail(order, config, recipientName);
  const text = renderOrderQcText(order, config, recipientName);

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user || config.pass
      ? {
          user: config.user,
          pass: config.pass
        }
      : undefined
  });

  try {
    await transporter.sendMail({
      from: formatMailbox(config.fromName, config.fromEmail),
      to: order.user.email,
      subject,
      html,
      text
    });

    await prisma.emailLog.updateMany({
      where: {
        to: order.user.email,
        template: ORDER_QC_TEMPLATE,
        subject,
        status: "queued"
      },
      data: {
        status: "sent",
        error: null
      }
    });

    return { sent: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send QC email.";

    logger.warn(
      {
        event: "order_qc_email_failed",
        orderId: order.id,
        orderNo: order.orderNo,
        recipient: order.user.email,
        error: message
      },
      "Order QC email failed"
    );

    await prisma.emailLog.updateMany({
      where: {
        to: order.user.email,
        template: ORDER_QC_TEMPLATE,
        subject,
        status: "queued"
      },
      data: {
        status: "failed",
        error: message
      }
    });

    return { sent: false as const, error: message };
  }
}

export async function sendShippingPaymentRequestEmail(orderId: number, options?: { forceResend?: boolean }) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNo: true,
      currency: true,
      actualShippingUsd: true,
      shippingPaymentStatus: true,
      packages: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          packageNo: true,
          shippingFeeUsd: true
        }
      },
      shippingAddressSnapshot: true,
      user: {
        select: {
          email: true,
          name: true
        }
      },
      address: {
        select: {
          contactName: true,
          phone: true,
          country: true,
          state: true,
          city: true,
          postalCode: true,
          line1: true,
          line2: true
        }
      }
    }
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  const freightAmount = decimalToNumber(order.packages[0]?.shippingFeeUsd ?? order.actualShippingUsd);
  if (freightAmount <= 0) {
    return { skipped: true, reason: "shipping_fee_not_set" as const };
  }

  const subject = `Shipping payment required for order ${order.orderNo}`;
  const forceResend = options?.forceResend === true;
  const reserved = await prisma.$transaction(async (tx) => {
    if (!forceResend) {
      const existing = await tx.emailLog.findFirst({
        where: {
          to: order.user.email,
          template: ORDER_SHIPPING_PAYMENT_TEMPLATE,
          subject,
          status: { in: ["queued", "sent"] }
        }
      });

      if (existing) {
        return false;
      }
    }

    await tx.emailLog.create({
      data: {
        to: order.user.email,
        subject,
        template: ORDER_SHIPPING_PAYMENT_TEMPLATE,
        status: "queued"
      }
    });

    return true;
  });

  if (!reserved) {
    return { skipped: true, reason: "already_logged" as const };
  }

  const config = await getMailConfig();
  if (!config) {
    await prisma.emailLog.updateMany({
      where: {
        to: order.user.email,
        template: ORDER_SHIPPING_PAYMENT_TEMPLATE,
        subject,
        status: "queued"
      },
      data: {
        status: "failed",
        error: "SMTP is not configured."
      }
    });
    return { skipped: true, reason: "smtp_not_configured" as const };
  }

  const recipientName = order.user.name?.trim() || readAddress(order)?.contactName?.trim() || order.user.email.split("@")[0];
  const html = renderShippingPaymentEmail(order, config, recipientName);
  const text = renderShippingPaymentText(order, config, recipientName);

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user || config.pass
      ? {
          user: config.user,
          pass: config.pass
        }
      : undefined
  });

  try {
    await transporter.sendMail({
      from: formatMailbox(config.fromName, config.fromEmail),
      to: order.user.email,
      subject,
      html,
      text
    });

    await prisma.emailLog.updateMany({
      where: {
        to: order.user.email,
        template: ORDER_SHIPPING_PAYMENT_TEMPLATE,
        subject,
        status: "queued"
      },
      data: {
        status: "sent",
        error: null
      }
    });

    return { sent: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send shipping payment email.";

    logger.warn(
      {
        event: "shipping_payment_email_failed",
        orderId: order.id,
        orderNo: order.orderNo,
        recipient: order.user.email,
        error: message
      },
      "Shipping payment email failed"
    );

    await prisma.emailLog.updateMany({
      where: {
        to: order.user.email,
        template: ORDER_SHIPPING_PAYMENT_TEMPLATE,
        subject,
        status: "queued"
      },
      data: {
        status: "failed",
        error: message
      }
    });

    return { sent: false as const, error: message };
  }
}

export async function sendShippingPaymentPaidEmail(orderId: number, packageId?: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNo: true,
      currency: true,
      shippingPaymentStatus: true,
      shippingStatus: true,
      user: {
        select: {
          email: true,
          name: true
        }
      },
      address: {
        select: {
          contactName: true,
          phone: true,
          country: true,
          state: true,
          city: true,
          postalCode: true,
          line1: true,
          line2: true
        }
      },
      shippingAddressSnapshot: true,
      packages: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          packageNo: true,
          shippingFeeUsd: true,
          trackingNumber: true,
          shippingChannel: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  const targetPackage = packageId
    ? order.packages.find((pkg) => pkg.id === packageId)
    : order.packages[0];

  if (!targetPackage) {
    return { skipped: true, reason: "package_not_found" as const };
  }

  const freightAmount = decimalToNumber(targetPackage.shippingFeeUsd);
  if (freightAmount <= 0) {
    return { skipped: true, reason: "shipping_fee_not_set" as const };
  }

  const subject = `Shipping payment confirmed for order ${order.orderNo}`;
  const reserved = await prisma.$transaction(async (tx) => {
    const existing = await tx.emailLog.findFirst({
      where: {
        to: order.user.email,
        template: ORDER_SHIPPING_PAID_TEMPLATE,
        subject,
        status: { in: ["queued", "sent"] }
      }
    });

    if (existing) {
      return false;
    }

    await tx.emailLog.create({
      data: {
        to: order.user.email,
        subject,
        template: ORDER_SHIPPING_PAID_TEMPLATE,
        status: "queued"
      }
    });

    return true;
  });

  if (!reserved) {
    return { skipped: true, reason: "already_logged" as const };
  }

  const config = await getMailConfig();
  if (!config) {
    await prisma.emailLog.updateMany({
      where: {
        to: order.user.email,
        template: ORDER_SHIPPING_PAID_TEMPLATE,
        subject,
        status: "queued"
      },
      data: {
        status: "failed",
        error: "SMTP is not configured."
      }
    });
    return { skipped: true, reason: "smtp_not_configured" as const };
  }

  const recipientName = order.user.name?.trim() || readAddress(order)?.contactName?.trim() || order.user.email.split("@")[0];
  const html = renderShippingPaymentPaidEmail(order, targetPackage, config, recipientName);
  const text = renderShippingPaymentPaidText(order, targetPackage, config, recipientName);

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user || config.pass
      ? {
          user: config.user,
          pass: config.pass
        }
      : undefined
  });

  try {
    await transporter.sendMail({
      from: formatMailbox(config.fromName, config.fromEmail),
      to: order.user.email,
      subject,
      html,
      text
    });

    await prisma.emailLog.updateMany({
      where: {
        to: order.user.email,
        template: ORDER_SHIPPING_PAID_TEMPLATE,
        subject,
        status: "queued"
      },
      data: {
        status: "sent",
        error: null
      }
    });

    return { sent: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send shipping payment success email.";

    logger.warn(
      {
        event: "shipping_payment_paid_email_failed",
        orderId: order.id,
        orderNo: order.orderNo,
        recipient: order.user.email,
        packageId: targetPackage.id,
        error: message
      },
      "Shipping payment paid email failed"
    );

    await prisma.emailLog.updateMany({
      where: {
        to: order.user.email,
        template: ORDER_SHIPPING_PAID_TEMPLATE,
        subject,
        status: "queued"
      },
      data: {
        status: "failed",
        error: message
      }
    });

    return { sent: false as const, error: message };
  }
}

async function getMailConfig(): Promise<MailConfig | null> {
  const keys = [
    "smtp_host",
    "smtp_port",
    "smtp_user",
    "smtp_password",
    "smtp_from_email",
    "smtp_from_name",
    "smtp_secure",
    "site_name",
    "nextauth_url",
    "auth_email_server",
    "auth_email_from"
  ];
  const settings = await prisma.setting.findMany({ where: { key: { in: keys } } });
  const map = new Map(settings.map((setting) => [setting.key, setting.value]));

  const siteName = map.get("site_name") || normalizeEnvValue(process.env.SITE_NAME) || "CNSnap";
  const baseUrl = normalizeEnvValue(process.env.APP_URL) || normalizeEnvValue(process.env.NEXTAUTH_URL) || map.get("nextauth_url") || "http://localhost:3000";

  const dbHost = map.get("smtp_host") || "";
  const dbFromEmail = map.get("smtp_from_email") || "";
  if (dbHost && dbFromEmail) {
    return {
      host: dbHost,
      port: normalizePort(map.get("smtp_port"), 587),
      secure: normalizeBoolean(map.get("smtp_secure")),
      user: map.get("smtp_user") || "",
      pass: map.get("smtp_password") || "",
      fromEmail: dbFromEmail,
      fromName: map.get("smtp_from_name") || siteName,
      siteName,
      baseUrl
    };
  }

  const envHost = normalizeEnvValue(process.env.SMTP_HOST);
  const envFromEmail = normalizeEnvValue(process.env.SMTP_FROM_EMAIL);
  if (envHost && envFromEmail) {
    return {
      host: envHost,
      port: normalizePort(normalizeEnvValue(process.env.SMTP_PORT), 587),
      secure: normalizeBoolean(normalizeEnvValue(process.env.SMTP_SECURE)),
      user: normalizeEnvValue(process.env.SMTP_USER) || "",
      pass: normalizeEnvValue(process.env.SMTP_PASSWORD) || normalizeEnvValue(process.env.SMTP_PASS) || "",
      fromEmail: envFromEmail,
      fromName: normalizeEnvValue(process.env.SMTP_FROM_NAME) || siteName,
      siteName,
      baseUrl
    };
  }

  const authEmailServer = process.env.EMAIL_SERVER || map.get("auth_email_server") || "";
  const authEmailFrom = process.env.EMAIL_FROM || map.get("auth_email_from") || "";
  if (!authEmailServer || !authEmailFrom) {
    return null;
  }

  try {
    const parsed = new URL(authEmailServer);
    const parsedFrom = parseMailbox(authEmailFrom);

    return {
      host: parsed.hostname,
      port: Number(parsed.port || (parsed.protocol === "smtps:" ? 465 : 587)),
      secure: parsed.protocol === "smtps:" || parsed.searchParams.get("secure") === "true",
      user: decodeURIComponent(parsed.username || ""),
      pass: decodeURIComponent(parsed.password || ""),
      fromEmail: parsedFrom.email,
      fromName: parsedFrom.name || siteName,
      siteName,
      baseUrl
    };
  } catch {
    return null;
  }
}

function parseMailbox(value: string) {
  const match = value.match(/^(.*?)<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].trim().replace(/^"|"$/g, ""),
      email: match[2].trim()
    };
  }

  return {
    name: "",
    email: value.trim()
  };
}

function formatMailbox(name: string, email: string) {
  return name ? `${name} <${email}>` : email;
}

function orderPaidSubject(orderNo: string) {
  return `Payment confirmed for order ${orderNo}`;
}

function renderOrderPaidEmail(order: OrderEmailRow, config: MailConfig, recipientName: string) {
  const address = readAddress(order);
  const orderUrl = `${config.baseUrl.replace(/\/$/, "")}/account/orders/${order.id}`;
  const paidAt = order.paidAt ?? order.createdAt;
  const itemRows = order.items.map((item) => {
    const lineTotal = decimalToNumber(item.priceUsd) * item.quantity;

    return `
      <tr>
        <td style="padding:16px 0;border-bottom:1px solid #e5e7eb;">
          <div style="display:flex;gap:14px;align-items:flex-start;">
            ${item.image ? `<img src="${escapeAttribute(item.image)}" alt="${escapeAttribute(item.title)}" width="72" height="72" style="border-radius:16px;object-fit:cover;border:1px solid #e5e7eb;" />` : ""}
            <div>
              <div style="font-size:15px;font-weight:700;color:#111827;line-height:1.5;">${escapeHtml(item.title)}</div>
              ${item.skuText ? `<div style="margin-top:4px;font-size:13px;color:#6b7280;">${escapeHtml(item.skuText)}</div>` : ""}
              <div style="margin-top:6px;font-size:13px;color:#6b7280;">Qty: ${item.quantity}</div>
            </div>
          </div>
        </td>
        <td style="padding:16px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-size:14px;font-weight:700;color:#111827;vertical-align:top;">
          ${money(lineTotal, order.currency)}
        </td>
      </tr>
    `;
  }).join("");

  const addressHtml = address
    ? `
      <div style="margin-top:8px;font-size:14px;line-height:1.7;color:#374151;">
        <div style="font-weight:700;color:#111827;">${escapeHtml(address.contactName || recipientName)}</div>
        ${address.phone ? `<div>${escapeHtml(address.phone)}</div>` : ""}
        <div>${escapeHtml(address.line1 || "")}${address.line2 ? `<br/>${escapeHtml(address.line2)}` : ""}</div>
        <div>${escapeHtml([address.city, address.state].filter(Boolean).join(", "))}${address.postalCode ? ` ${escapeHtml(address.postalCode)}` : ""}</div>
        <div>${escapeHtml(address.country || "")}</div>
      </div>
    `
    : `<div style="margin-top:8px;font-size:14px;line-height:1.7;color:#6b7280;">No shipping address on file.</div>`;

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(orderPaidSubject(order.orderNo))}</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;background:#ffffff;border-radius:28px;overflow:hidden;border:1px solid #e5e7eb;">
                <tr>
                  <td style="padding:28px 32px;background:linear-gradient(135deg,#111827 0%,#1f2937 45%,#ef4444 100%);">
                    <div style="font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#fca5a5;">${escapeHtml(config.siteName)}</div>
                    <div style="margin-top:12px;font-size:30px;line-height:1.15;font-weight:800;color:#ffffff;">Payment received</div>
                    <div style="margin-top:10px;max-width:520px;font-size:15px;line-height:1.7;color:#e5e7eb;">
                      Hi ${escapeHtml(recipientName)}, your payment for order <strong>${escapeHtml(order.orderNo)}</strong> has been confirmed. Our purchasing team can now continue processing your items.
                    </div>
                    <div style="margin-top:22px;">
                      <a href="${escapeAttribute(orderUrl)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#ffffff;color:#111827;text-decoration:none;font-size:14px;font-weight:800;">View your order</a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 32px 10px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:18px;border-radius:20px;background:#f9fafb;border:1px solid #e5e7eb;">
                          <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Order No</div>
                          <div style="margin-top:6px;font-size:18px;font-weight:800;color:#111827;">${escapeHtml(order.orderNo)}</div>
                        </td>
                        <td width="12"></td>
                        <td style="padding:18px;border-radius:20px;background:#f9fafb;border:1px solid #e5e7eb;">
                          <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Payment date</div>
                          <div style="margin-top:6px;font-size:18px;font-weight:800;color:#111827;">${escapeHtml(formatEmailDate(paidAt))}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 32px 0;">
                    <div style="font-size:20px;font-weight:800;color:#111827;">Order summary</div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:12px;">
                      ${itemRows}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 32px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:24px;border-radius:24px;background:#f9fafb;border:1px solid #e5e7eb;vertical-align:top;">
                          <div style="font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;">Shipping address</div>
                          ${addressHtml}
                        </td>
                        <td width="16"></td>
                        <td style="padding:24px;border-radius:24px;background:#f9fafb;border:1px solid #e5e7eb;vertical-align:top;">
                          <div style="font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;">Payment summary</div>
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:12px;border-collapse:collapse;">
                            ${summaryRow("Items subtotal", money(decimalToNumber(order.subtotalUsd), order.currency))}
                            ${summaryRow("Service fee", money(decimalToNumber(order.serviceFeeUsd), order.currency))}
                            ${decimalToNumber(order.domesticShippingUsd) > 0 ? summaryRow("Domestic shipping", money(decimalToNumber(order.domesticShippingUsd), order.currency)) : ""}
                            ${decimalToNumber(order.valueAddedServicesUsd) > 0 ? summaryRow("Value-added services", money(decimalToNumber(order.valueAddedServicesUsd), order.currency)) : ""}
                            ${decimalToNumber(order.discountUsd) > 0 ? summaryRow("Discount", `-${money(decimalToNumber(order.discountUsd), order.currency)}`) : ""}
                            <tr>
                              <td colspan="2" style="padding-top:14px;border-bottom:1px solid #d1d5db;font-size:0;line-height:0;">&nbsp;</td>
                            </tr>
                            <tr>
                              <td style="padding-top:14px;font-size:16px;line-height:1.4;font-weight:800;color:#111827;">Total paid</td>
                              <td align="right" style="padding-top:14px;font-size:16px;line-height:1.4;font-weight:800;color:#111827;white-space:nowrap;">${money(decimalToNumber(order.paidUsd), order.currency)}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 32px 32px;">
                    <div style="padding:18px 20px;border-radius:20px;background:#fff7ed;border:1px solid #fed7aa;font-size:14px;line-height:1.7;color:#9a3412;">
                      We will continue the purchasing workflow and update your order timeline as each milestone is completed. If you have questions, reply to this email or visit your order page for the latest status.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function renderOrderPaidText(order: OrderEmailRow, config: MailConfig, recipientName: string) {
  const orderUrl = `${config.baseUrl.replace(/\/$/, "")}/account/orders/${order.id}`;
  const address = readAddress(order);
  const lines = [
    `${config.siteName} payment confirmation`,
    "",
    `Hi ${recipientName},`,
    "",
    `Your payment for order ${order.orderNo} has been confirmed.`,
    `Order link: ${orderUrl}`,
    `Payment date: ${formatEmailDate(order.paidAt ?? order.createdAt)}`,
    "",
    "Items:"
  ];

  for (const item of order.items) {
    lines.push(`- ${item.title}${item.skuText ? ` (${item.skuText})` : ""} x${item.quantity} - ${money(decimalToNumber(item.priceUsd) * item.quantity, order.currency)}`);
  }

  lines.push("");
  lines.push(`Items subtotal: ${money(decimalToNumber(order.subtotalUsd), order.currency)}`);
  lines.push(`Service fee: ${money(decimalToNumber(order.serviceFeeUsd), order.currency)}`);
  if (decimalToNumber(order.domesticShippingUsd) > 0) lines.push(`Domestic shipping: ${money(decimalToNumber(order.domesticShippingUsd), order.currency)}`);
  if (decimalToNumber(order.valueAddedServicesUsd) > 0) lines.push(`Value-added services: ${money(decimalToNumber(order.valueAddedServicesUsd), order.currency)}`);
  if (decimalToNumber(order.discountUsd) > 0) lines.push(`Discount: -${money(decimalToNumber(order.discountUsd), order.currency)}`);
  lines.push(`Total paid: ${money(decimalToNumber(order.paidUsd), order.currency)}`);

  if (address) {
    lines.push("");
    lines.push("Shipping address:");
    lines.push(address.contactName || recipientName);
    if (address.phone) lines.push(address.phone);
    if (address.line1) lines.push(address.line1);
    if (address.line2) lines.push(address.line2);
    lines.push([address.city, address.state, address.postalCode].filter(Boolean).join(", "));
    if (address.country) lines.push(address.country);
  }

  lines.push("");
  lines.push("We will continue processing your order and keep the status updated in your account.");
  return lines.join("\n");
}

function renderOrderQcEmail(order: OrderEmailRow, config: MailConfig, recipientName: string) {
  const orderUrl = `${config.baseUrl.replace(/\/$/, "")}/account/orders/${order.id}`;
  const latestPackage = order.packages?.[0];
  const packageId = latestPackage?.id;
  const packageNoLabel = latestPackage?.packageNo ?? "";
  const shippingPaymentUrl = packageId
    ? `${config.baseUrl.replace(/\/$/, "")}/account/packages/${packageId}/pay`
    : `${config.baseUrl.replace(/\/$/, "")}/account/orders/${order.id}/pay`;
  const freightAmount = decimalToNumber(latestPackage?.shippingFeeUsd ?? order.actualShippingUsd ?? 0);
  const hasShippingPayment = freightAmount > 0;
  const freightAmountLabel = hasShippingPayment ? money(freightAmount, order.currency || "USD") : "";
  const qcGallery = (order.mediaAssets ?? []).map((asset) => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #e5e7eb;">
        ${(() => {
          const assetUrl = absoluteEmailUrl(config.baseUrl, asset.url);
          return `
        <div style="display:flex;gap:14px;align-items:flex-start;">
          <img src="${escapeAttribute(assetUrl)}" alt="${escapeAttribute(asset.altText || asset.originalName)}" width="120" height="120" style="border-radius:18px;object-fit:cover;border:1px solid #e5e7eb;background:#f8fafc;" />
          <div>
            <div style="font-size:15px;font-weight:700;color:#111827;line-height:1.5;">${escapeHtml(asset.originalName)}</div>
            <div style="margin-top:6px;font-size:13px;color:#6b7280;">Please review this QC photo and reply to confirm whether shipment can proceed.</div>
            <div style="margin-top:8px;">
              <a href="${escapeAttribute(assetUrl)}" style="display:inline-block;padding:10px 16px;border-radius:999px;background:#eff6ff;color:#1d4ed8;text-decoration:none;font-size:13px;font-weight:800;">Open full image</a>
            </div>
          </div>
        </div>
          `;
        })()}
      </td>
    </tr>
  `).join("");

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(`QC photos ready for order ${order.orderNo}`)}</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:760px;background:#ffffff;border-radius:28px;overflow:hidden;border:1px solid #e5e7eb;">
                <tr>
                  <td style="padding:28px 32px;background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 50%,#38bdf8 100%);">
                    <div style="font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#bfdbfe;">${escapeHtml(config.siteName)}</div>
                    <div style="margin-top:12px;font-size:30px;line-height:1.15;font-weight:800;color:#ffffff;">QC photos and shipping payment are ready</div>
                    <div style="margin-top:10px;max-width:560px;font-size:15px;line-height:1.7;color:#dbeafe;">
                      Hi ${escapeHtml(recipientName)}, we have completed the warehouse quality check for order <strong>${escapeHtml(order.orderNo)}</strong>. Please review the QC photos below and, if everything looks good, complete the international shipping payment so we can dispatch your parcel.
                    </div>
                    <div style="margin-top:22px;">
                      <a href="${escapeAttribute(orderUrl)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#ffffff;color:#111827;text-decoration:none;font-size:14px;font-weight:800;">Open order details</a>
                      ${hasShippingPayment ? `<a href="${escapeAttribute(shippingPaymentUrl)}" style="display:inline-block;margin-left:10px;padding:14px 22px;border-radius:999px;background:#ef4444;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;">Pay shipping fee ${escapeHtml(freightAmountLabel)}</a>` : ""}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 32px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:16px 18px;border-radius:18px;background:#f9fafb;border:1px solid #e5e7eb;vertical-align:top;">
                          <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Order No</div>
                          <div style="margin-top:6px;font-size:20px;line-height:1.3;font-weight:800;color:#111827;">${escapeHtml(order.orderNo)}</div>
                        </td>
                        <td width="12"></td>
                        <td style="padding:16px 18px;border-radius:18px;background:#f9fafb;border:1px solid #e5e7eb;vertical-align:top;">
                          <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Package No</div>
                          <div style="margin-top:6px;font-size:20px;line-height:1.3;font-weight:800;color:#111827;">${escapeHtml(packageNoLabel || "Pending package")}</div>
                        </td>
                        <td width="12"></td>
                        <td style="padding:16px 18px;border-radius:18px;background:#eff6ff;border:1px solid #bfdbfe;vertical-align:top;">
                          <div style="font-size:11px;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.08em;font-weight:800;">Shipping fee due</div>
                          <div style="margin-top:6px;font-size:20px;line-height:1.3;font-weight:900;color:#0f172a;">${escapeHtml(hasShippingPayment ? freightAmountLabel : "Pending")}</div>
                        </td>
                      </tr>
                    </table>
                    <div style="margin-top:12px;padding:16px 18px;border-radius:18px;background:#fff7ed;border:1px solid #fed7aa;font-size:14px;line-height:1.7;color:#9a3412;">
                      Please reply to this email after reviewing the photos. Our warehouse team will only proceed to shipment after your confirmation.
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 32px 8px;">
                    ${hasShippingPayment ? `
                    <div style="margin-bottom:20px;padding:20px 22px;border-radius:22px;background:#eff6ff;border:1px solid #bfdbfe;">
                      <div style="font-size:12px;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.08em;font-weight:800;">International shipping payment</div>
                      ${packageNoLabel ? `<div style="margin-top:6px;font-size:13px;font-weight:700;color:#334155;">Package: ${escapeHtml(packageNoLabel)}</div>` : ""}
                      <div style="margin-top:8px;font-size:32px;font-weight:900;color:#0f172a;">${escapeHtml(freightAmountLabel)}</div>
                      <div style="margin-top:10px;font-size:14px;line-height:1.7;color:#334155;">
                        If the QC photos look correct, please pay the international shipping fee with the button above. Once payment is completed, our team can move your parcel into dispatch.
                      </div>
                      <div style="margin-top:14px;">
                        <a href="${escapeAttribute(shippingPaymentUrl)}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#ef4444;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;">Pay shipping fee now</a>
                      </div>
                      <div style="margin-top:10px;font-size:12px;line-height:1.7;color:#64748b;word-break:break-all;">
                        If the button above does not open, copy this link into your browser:
                        <br />
                        <a href="${escapeAttribute(shippingPaymentUrl)}" style="color:#1d4ed8;text-decoration:none;font-weight:700;">${escapeHtml(shippingPaymentUrl)}</a>
                      </div>
                    </div>
                    ` : ""}
                    <div style="font-size:20px;font-weight:800;color:#111827;">QC photo gallery</div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:12px;">
                      ${qcGallery}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 32px 32px;">
                    <div style="padding:18px 20px;border-radius:20px;background:#f8fafc;border:1px solid #e5e7eb;font-size:14px;line-height:1.8;color:#334155;">
                      Recommended next step:
                      <br />
                      1. Review every QC image
                      <br />
                      2. Reply to this email if anything needs adjustment
                      <br />
                      3. ${hasShippingPayment ? `Pay the international shipping fee (${escapeHtml(freightAmountLabel)}) once everything looks correct` : "Confirm shipment once everything looks correct"}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function renderOrderQcText(order: OrderEmailRow, config: MailConfig, recipientName: string) {
  const orderUrl = `${config.baseUrl.replace(/\/$/, "")}/account/orders/${order.id}`;
  const latestPackage = order.packages?.[0];
  const packageId = latestPackage?.id;
  const shippingPaymentUrl = packageId
    ? `${config.baseUrl.replace(/\/$/, "")}/account/packages/${packageId}/pay`
    : `${config.baseUrl.replace(/\/$/, "")}/account/orders/${order.id}/pay`;
  const freightAmount = decimalToNumber(latestPackage?.shippingFeeUsd ?? order.actualShippingUsd ?? 0);
  const packageNoLabel = latestPackage?.packageNo ?? "";
  const lines = [
    `${config.siteName} QC photos and shipping payment ready`,
    "",
    `Hi ${recipientName},`,
    "",
    `We have completed the warehouse quality check for order ${order.orderNo}.`,
    "Please review the QC photos below. If everything looks correct, complete the international shipping payment so we can proceed with shipment.",
    `Order link: ${orderUrl}`,
    "",
    "QC photos:"
  ];

  for (const asset of order.mediaAssets ?? []) {
    lines.push(`- ${asset.originalName}: ${absoluteEmailUrl(config.baseUrl, asset.url)}`);
  }

  if (freightAmount > 0) {
    lines.push("");
    lines.push(`Order No: ${order.orderNo}`);
    if (packageNoLabel) lines.push(`Package: ${packageNoLabel}`);
    lines.push(`International shipping fee: ${money(freightAmount, order.currency || "USD")}`);
    lines.push(`Pay shipping now: ${shippingPaymentUrl}`);
  }

  lines.push("");
  lines.push("Please reply to this email if anything needs adjustment. If the QC photos look correct, pay the shipping fee and we will continue dispatch.");
  return lines.join("\n");
}

function renderShippingPaymentEmail(
  order: {
    id: number;
    orderNo: string;
    currency: string;
    actualShippingUsd: DecimalValue;
    packages?: Array<{ id: number; packageNo: string }>;
    user: { email: string; name: string | null };
    address: OrderEmailRow["address"];
    shippingAddressSnapshot: unknown;
  },
  config: MailConfig,
  recipientName: string
) {
  const orderUrl = `${config.baseUrl.replace(/\/$/, "")}/account/orders/${order.id}`;
  const packageId = order.packages?.[0]?.id;
  const payUrl = packageId
    ? `${config.baseUrl.replace(/\/$/, "")}/account/packages/${packageId}/pay`
    : `${config.baseUrl.replace(/\/$/, "")}/account/orders/${order.id}/pay`;
  const freightAmount = money(decimalToNumber(order.actualShippingUsd), order.currency || "USD");
  const address = readAddress(order);

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(`Shipping payment required for order ${order.orderNo}`)}</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;background:#ffffff;border-radius:28px;overflow:hidden;border:1px solid #e5e7eb;">
                <tr>
                  <td style="padding:28px 32px;background:linear-gradient(135deg,#111827 0%,#1d4ed8 55%,#22c55e 100%);">
                    <div style="font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#bfdbfe;">${escapeHtml(config.siteName)}</div>
                    <div style="margin-top:12px;font-size:30px;line-height:1.15;font-weight:800;color:#ffffff;">Shipping payment required</div>
                    <div style="margin-top:10px;max-width:540px;font-size:15px;line-height:1.7;color:#e5e7eb;">
                      Hi ${escapeHtml(recipientName)}, your parcel is ready for the international shipping payment step. Please review the freight amount below and complete payment so we can dispatch your order.
                    </div>
                    <div style="margin-top:22px;">
                      <a href="${escapeAttribute(payUrl)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#ffffff;color:#111827;text-decoration:none;font-size:14px;font-weight:800;">Pay shipping now</a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 32px;">
                    <div style="display:grid;gap:16px;">
                      <div style="padding:20px;border-radius:22px;background:#f9fafb;border:1px solid #e5e7eb;">
                        <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Order No</div>
                        <div style="margin-top:6px;font-size:20px;font-weight:800;color:#111827;">${escapeHtml(order.orderNo)}</div>
                      </div>
                      <div style="padding:24px;border-radius:22px;background:#eff6ff;border:1px solid #bfdbfe;">
                        <div style="font-size:12px;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.08em;font-weight:800;">International freight due</div>
                        <div style="margin-top:8px;font-size:32px;font-weight:900;color:#0f172a;">${escapeHtml(freightAmount)}</div>
                        <div style="margin-top:10px;font-size:14px;line-height:1.7;color:#334155;">
                          This amount covers the outbound international shipping for your parcel. Once payment is complete, our team can move the shipment into dispatch.
                        </div>
                      </div>
                      <div style="padding:20px;border-radius:22px;background:#f9fafb;border:1px solid #e5e7eb;">
                        <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Shipping destination</div>
                        <div style="margin-top:8px;font-size:14px;line-height:1.7;color:#374151;">
                          <div style="font-weight:700;color:#111827;">${escapeHtml(address?.contactName || recipientName)}</div>
                          ${address?.phone ? `<div>${escapeHtml(address.phone)}</div>` : ""}
                          <div>${escapeHtml(address?.line1 || "")}${address?.line2 ? `<br/>${escapeHtml(address.line2)}` : ""}</div>
                          <div>${escapeHtml([address?.city, address?.state].filter(Boolean).join(", "))}${address?.postalCode ? ` ${escapeHtml(address.postalCode)}` : ""}</div>
                          <div>${escapeHtml(address?.country || "")}</div>
                        </div>
                      </div>
                      <div style="padding:18px 20px;border-radius:20px;background:#fff7ed;border:1px solid #fed7aa;font-size:14px;line-height:1.7;color:#9a3412;">
                        After payment, please return to your order page to track the next updates. You can also reply to this email if you need route or freight clarification before paying.
                      </div>
                      <div>
                        <a href="${escapeAttribute(orderUrl)}" style="font-size:14px;font-weight:700;color:#1d4ed8;text-decoration:none;">View order details</a>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function renderShippingPaymentText(
  order: {
    id: number;
    orderNo: string;
    currency: string;
    actualShippingUsd: DecimalValue;
    packages?: Array<{ id: number; packageNo: string }>;
  },
  config: MailConfig,
  recipientName: string
) {
  const orderUrl = `${config.baseUrl.replace(/\/$/, "")}/account/orders/${order.id}`;
  const packageId = order.packages?.[0]?.id;
  const payUrl = packageId
    ? `${config.baseUrl.replace(/\/$/, "")}/account/packages/${packageId}/pay`
    : `${config.baseUrl.replace(/\/$/, "")}/account/orders/${order.id}/pay`;
  const freightAmount = money(decimalToNumber(order.actualShippingUsd), order.currency || "USD");

  return [
    `${config.siteName} shipping payment required`,
    "",
    `Hi ${recipientName},`,
    "",
    `Your parcel for order ${order.orderNo} is ready for the international shipping payment step.`,
    `Freight amount due: ${freightAmount}`,
    `Pay now: ${payUrl}`,
    `Order details: ${orderUrl}`,
    "",
    "Once payment is complete, our team can move the shipment into dispatch.",
    "Reply to this email if you need route or freight clarification before paying."
  ].join("\n");
}

function renderShippingPaymentPaidEmail(
  order: {
    id: number;
    orderNo: string;
    currency: string;
    shippingStatus: string;
    user: { email: string; name: string | null };
    address: OrderEmailRow["address"];
    shippingAddressSnapshot: unknown;
  },
  pkg: {
    id: number;
    packageNo: string;
    shippingFeeUsd: DecimalValue;
    trackingNumber: string | null;
    shippingChannel: { name: string } | null;
  },
  config: MailConfig,
  recipientName: string
) {
  const orderUrl = `${config.baseUrl.replace(/\/$/, "")}/account/orders/${order.id}`;
  const packageUrl = `${config.baseUrl.replace(/\/$/, "")}/account/packages/${pkg.id}`;
  const freightAmount = money(decimalToNumber(pkg.shippingFeeUsd), order.currency || "USD");
  const address = readAddress(order);

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(`Shipping payment confirmed for order ${order.orderNo}`)}</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;background:#ffffff;border-radius:28px;overflow:hidden;border:1px solid #e5e7eb;">
                <tr>
                  <td style="padding:28px 32px;background:linear-gradient(135deg,#0f172a 0%,#14532d 55%,#22c55e 100%);">
                    <div style="font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#bbf7d0;">${escapeHtml(config.siteName)}</div>
                    <div style="margin-top:12px;font-size:30px;line-height:1.15;font-weight:800;color:#ffffff;">International shipping payment received</div>
                    <div style="margin-top:10px;max-width:560px;font-size:15px;line-height:1.7;color:#dcfce7;">
                      Hi ${escapeHtml(recipientName)}, we have received your international shipping payment for order <strong>${escapeHtml(order.orderNo)}</strong>. Our warehouse team will continue processing your parcel and prepare it for dispatch.
                    </div>
                    <div style="margin-top:22px;">
                      <a href="${escapeAttribute(packageUrl)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#ffffff;color:#111827;text-decoration:none;font-size:14px;font-weight:800;">View package details</a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 32px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:18px;border-radius:20px;background:#f9fafb;border:1px solid #e5e7eb;">
                          <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Order No</div>
                          <div style="margin-top:6px;font-size:18px;font-weight:800;color:#111827;">${escapeHtml(order.orderNo)}</div>
                        </td>
                        <td width="12"></td>
                        <td style="padding:18px;border-radius:20px;background:#f9fafb;border:1px solid #e5e7eb;">
                          <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Package No</div>
                          <div style="margin-top:6px;font-size:18px;font-weight:800;color:#111827;">${escapeHtml(pkg.packageNo)}</div>
                        </td>
                      </tr>
                    </table>

                    <div style="margin-top:16px;padding:22px;border-radius:22px;background:#eff6ff;border:1px solid #bfdbfe;">
                      <div style="font-size:12px;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.08em;font-weight:800;">Shipping payment summary</div>
                      <div style="margin-top:8px;font-size:32px;font-weight:900;color:#0f172a;">${escapeHtml(freightAmount)}</div>
                      <div style="margin-top:10px;font-size:14px;line-height:1.7;color:#334155;">
                        ${pkg.shippingChannel?.name ? `Shipping channel: ${escapeHtml(pkg.shippingChannel.name)}<br/>` : ""}
                        ${pkg.trackingNumber ? `Tracking number: ${escapeHtml(pkg.trackingNumber)}<br/>` : ""}
                        Payment is complete. The next step is warehouse dispatch and carrier handoff.
                      </div>
                    </div>

                    <div style="margin-top:16px;padding:20px;border-radius:20px;background:#f9fafb;border:1px solid #e5e7eb;">
                      <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Shipping destination</div>
                      <div style="margin-top:8px;font-size:14px;line-height:1.7;color:#374151;">
                        <div style="font-weight:700;color:#111827;">${escapeHtml(address?.contactName || recipientName)}</div>
                        ${address?.phone ? `<div>${escapeHtml(address.phone)}</div>` : ""}
                        <div>${escapeHtml(address?.line1 || "")}${address?.line2 ? `<br/>${escapeHtml(address.line2)}` : ""}</div>
                        <div>${escapeHtml([address?.city, address?.state].filter(Boolean).join(", "))}${address?.postalCode ? ` ${escapeHtml(address.postalCode)}` : ""}</div>
                        <div>${escapeHtml(address?.country || "")}</div>
                      </div>
                    </div>

                    <div style="margin-top:16px;padding:18px 20px;border-radius:20px;background:#ecfdf5;border:1px solid #bbf7d0;font-size:14px;line-height:1.7;color:#166534;">
                      What happens next:
                      <br />
                      1. We confirm your parcel is cleared for dispatch
                      <br />
                      2. We hand it over to the shipping carrier
                      <br />
                      3. We update tracking in your account once the parcel is shipped
                    </div>

                    <div style="margin-top:18px;">
                      <a href="${escapeAttribute(orderUrl)}" style="font-size:14px;font-weight:700;color:#1d4ed8;text-decoration:none;">View order details</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function renderShippingPaymentPaidText(
  order: {
    id: number;
    orderNo: string;
    currency: string;
  },
  pkg: {
    id: number;
    packageNo: string;
    shippingFeeUsd: DecimalValue;
    trackingNumber: string | null;
    shippingChannel: { name: string } | null;
  },
  config: MailConfig,
  recipientName: string
) {
  const orderUrl = `${config.baseUrl.replace(/\/$/, "")}/account/orders/${order.id}`;
  const packageUrl = `${config.baseUrl.replace(/\/$/, "")}/account/packages/${pkg.id}`;
  const freightAmount = money(decimalToNumber(pkg.shippingFeeUsd), order.currency || "USD");

  return [
    `${config.siteName} shipping payment confirmed`,
    "",
    `Hi ${recipientName},`,
    "",
    `We have received your international shipping payment for order ${order.orderNo}.`,
    `Package: ${pkg.packageNo}`,
    `Shipping amount paid: ${freightAmount}`,
    pkg.shippingChannel?.name ? `Shipping channel: ${pkg.shippingChannel.name}` : "",
    pkg.trackingNumber ? `Tracking number: ${pkg.trackingNumber}` : "",
    "",
    "Your parcel will now continue to the dispatch stage.",
    "We will update tracking in your account after the carrier handoff is completed.",
    "",
    `Package details: ${packageUrl}`,
    `Order details: ${orderUrl}`
  ].filter(Boolean).join("\n");
}

function summaryRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding-top:12px;font-size:14px;line-height:1.5;color:#374151;">${escapeHtml(label)}</td>
      <td align="right" style="padding-top:12px;font-size:14px;line-height:1.5;font-weight:700;color:#111827;white-space:nowrap;">${escapeHtml(value)}</td>
    </tr>
  `;
}

function absoluteEmailUrl(baseUrl: string, assetUrl: string) {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const trimmed = assetUrl.trim();

  if (!trimmed) return normalizedBase;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.hostname === "uploads") {
        return `${normalizedBase}${parsed.pathname}`;
      }
      return trimmed;
    } catch {
      return trimmed;
    }
  }

  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed.replace(/^\/+/, "")}`;
  return `${normalizedBase}${normalizedPath}`;
}

function readAddress(order: Pick<OrderEmailRow, "address" | "shippingAddressSnapshot">) {
  const snapshot = order.shippingAddressSnapshot;
  if (snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)) {
    return snapshot as AddressSnapshot;
  }

  return order.address;
}

function decimalToNumber(value: DecimalValue) {
  const numeric = Number(typeof value === "object" ? value.toString() : value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeBoolean(value?: string | null) {
  return String(value || "").trim().toLowerCase() === "true";
}

function normalizePort(value: string | undefined | null, fallback: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

function normalizeEnvValue(value?: string | null) {
  if (!value) return "";
  return value.trim().replace(/^['"]|['"]$/g, "");
}

function formatEmailDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value);
}
