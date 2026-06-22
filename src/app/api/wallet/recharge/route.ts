import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, inactiveUserMessage, isUserActive } from "@/lib/session";
import { roundMoney } from "@/lib/currency";
import { prisma } from "@/lib/db";
import { createOnlyPayWalletRecharge, getOnlyPaySettings, onlyPayReady } from "@/modules/payment/onlypay";
import { createPayPalWalletRecharge, getPayPalSettings, paypalReady } from "@/modules/payment/paypal";

const minRechargeUsd = 5;
const maxRechargeUsd = 5000;

function paymentNo() {
  return `WAL${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`;
}

function providerOrderNo(userId: number) {
  return `WALLET-MANUAL-${userId}-${Date.now()}-${Math.floor(Math.random() * 900000 + 100000)}`;
}

function jsonObject<T extends Record<string, unknown>>(value: T) {
  return value as Prisma.InputJsonObject;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Please sign in before recharging your wallet." }, { status: 401 });
    if (!isUserActive(user.status)) return NextResponse.json({ error: inactiveUserMessage }, { status: 403 });

    const body = await request.json();
    const amount = roundMoney(Number(body.amount));
    const method = String(body.method || "");

    if (!Number.isFinite(amount) || amount < minRechargeUsd) {
      return NextResponse.json({ error: `Minimum recharge amount is $${minRechargeUsd}.` }, { status: 400 });
    }
    if (amount > maxRechargeUsd) {
      return NextResponse.json({ error: `Maximum recharge amount is $${maxRechargeUsd}.` }, { status: 400 });
    }

    if (method === "onlypay") {
      const settings = await getOnlyPaySettings();
      if (!onlyPayReady(settings)) {
        return NextResponse.json({ error: "Credit card payment is not available right now. Please choose bank transfer." }, { status: 400 });
      }
      const result = await createOnlyPayWalletRecharge(user.id, amount);
      return NextResponse.json({ status: "redirect", ...result });
    }

    if (method === "paypal") {
      const settings = await getPayPalSettings();
      if (!paypalReady(settings)) {
        return NextResponse.json({ error: "PayPal Checkout is not available right now. Please choose another method." }, { status: 400 });
      }
      const result = await createPayPalWalletRecharge(user.id, amount);
      return NextResponse.json({ status: "paypal", id: result.paypalOrderId, paymentId: result.paymentId });
    }

    if (method === "bank_transfer") {
      const payment = await prisma.payment.create({
        data: {
          paymentNo: paymentNo(),
          provider: "bank_transfer",
          providerOrderNo: providerOrderNo(user.id),
          type: "wallet_recharge",
          userId: user.id,
          amount,
          currency: "USD",
          status: "awaiting_transfer",
          paymentMethod: "Bank transfer",
          requestPayload: jsonObject({
            source: "wallet",
            amount,
            currency: "USD",
            submittedBy: user.email
          })
        }
      });

      return NextResponse.json({
        status: "awaiting_transfer",
        paymentId: payment.id,
        paymentNo: payment.paymentNo,
        message: "Recharge request submitted. We will credit your wallet after the transfer is confirmed."
      });
    }

    return NextResponse.json({ error: "Please choose a valid payment method." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Wallet recharge failed" }, { status: 400 });
  }
}
