"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { cancelOrderIfEligible } from "@/lib/account/order-cancellation";
import { getCurrentUser } from "@/lib/session";
import { generateReferralCode } from "@/lib/referral";

const ticketIssueTypes = [
  "Klarna Payment Issue",
  "International Logistics",
  "Not Shipped",
  "Not Packed",
  "Cannot Submit Parcel",
  "Parcel Weight/Volume",
  "Payment Failed",
  "Shipping Info Change",
  "Parcel Missing Items",
  "Coupon & Activity Issue",
  "Purchase Failed Order",
  "Rush Shipment",
  "Rush Warehouse",
  "Not Listed",
  "QC Photo"
];

export async function updateUserEmail(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please sign in again.");

  const email = String(formData.get("email") || "").toLowerCase().trim();
  if (!email || !email.includes("@")) throw new Error("Please enter a valid email address.");
  if (email === user.email) return;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists && exists.id !== user.id) throw new Error("This email is already used by another account.");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      email,
      referralCode: user.referralCode || generateReferralCode(email)
    }
  });

  revalidatePath("/user");
  revalidatePath("/user/security");
}

export async function updateUserPassword(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please sign in again.");

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (newPassword.length < 8) throw new Error("Password must be at least 8 characters.");
  if (newPassword !== confirmPassword) throw new Error("The new passwords do not match.");

  if (user.passwordHash) {
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new Error("Current password is incorrect.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash }
  });

  revalidatePath("/user/security");
}

export async function createSupportTicket(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please sign in again.");

  const orderOrTrackingNo = String(formData.get("orderOrTrackingNo") || "").trim();
  const issueType = String(formData.get("issueType") || "").trim();
  const problemDescription = String(formData.get("problemDescription") || "").trim();

  if (!orderOrTrackingNo) throw new Error("Order / Tracking No is required.");
  if (!ticketIssueTypes.includes(issueType)) throw new Error("Please select an issue type.");
  if (!problemDescription || problemDescription.length < 10) throw new Error("Please describe the problem in at least 10 characters.");
  if (problemDescription.length > 1000) throw new Error("Problem description must be under 1000 characters.");

  await prisma.supportTicket.create({
    data: {
      ticketNo: ticketNoForNow(new Date()),
      userId: user.id,
      orderOrTrackingNo,
      issueType,
      problemDescription,
      status: "open"
    }
  });

  revalidatePath("/account/tickets");
  revalidatePath("/admin/tickets");
}

export async function confirmOrderQcAndContinue(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please sign in again.");

  const orderId = Number(formData.get("orderId"));
  if (!Number.isFinite(orderId) || orderId <= 0) throw new Error("Order not found.");

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: user.id
    },
    select: {
      id: true,
      qcSharedWithCustomer: true,
      qcCustomerConfirmed: true,
      packages: {
        orderBy: { createdAt: "desc" },
        select: { id: true }
      }
    }
  });
  if (!order) throw new Error("Order not found.");
  if (!order.qcSharedWithCustomer) throw new Error("QC photos are not ready for confirmation yet.");

  const payablePackage = order.packages[0];
  if (!payablePackage) throw new Error("Package not found.");

  if (!order.qcCustomerConfirmed) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        qcCustomerConfirmed: true,
        qcCustomerConfirmedAt: new Date(),
        qcCustomerConfirmedBy: user.id,
        logs: {
          create: {
            actorId: user.id,
            action: "customer_qc_confirmed",
            detail: "Customer confirmed QC photos from account center"
          }
        }
      }
    });
  }

  revalidatePath(`/account/orders/${order.id}`);
  revalidatePath(`/account/packages/${payablePackage.id}`);
  revalidatePath("/account/orders");
  revalidatePath("/account/packages");
  redirect(`/account/packages/${payablePackage.id}/pay`);
}

export async function cancelAccountOrder(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please sign in again.");

  const orderId = Number(formData.get("orderId"));
  if (!Number.isFinite(orderId) || orderId <= 0) throw new Error("Order not found.");

  const result = await cancelOrderIfEligible({
    orderId,
    userId: user.id,
    actorId: user.id,
    reason: "user_requested"
  });

  if (!result.ok) {
    if (result.code === "not_found") throw new Error("Order not found.");
    throw new Error("Only unpaid orders can be cancelled before purchasing starts.");
  }

  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/checkout");
  redirect(`/account/orders/${orderId}?cancel=success`);
}

function ticketNoForNow(now: Date) {
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `TK${date}${String(now.getTime()).slice(-6)}`;
}
