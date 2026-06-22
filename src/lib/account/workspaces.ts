import { shippingCoupons, serviceFeeDiscounts } from "@/components/frontend/promotion/promotion-data";
import { prisma } from "@/lib/db";
import { getAccountOrders } from "@/lib/account/orders";
import { getAccountPackages } from "@/lib/account/packages";
import { listMockTickets } from "@/lib/account/tickets";
import { getCurrentUser } from "@/lib/session";
import { ticketCategoryLabel } from "@/types/ticket";

export async function getAccountBillingWorkspace() {
  const user = await getCurrentUser();
  const [transactions, rechargePayments, orders, packages] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { userId: user?.id },
      orderBy: { createdAt: "desc" },
      take: 12
    }),
    prisma.payment.findMany({
      where: { userId: user?.id, type: "wallet_recharge" },
      orderBy: { createdAt: "desc" },
      take: 6
    }),
    getAccountOrders(),
    getAccountPackages()
  ]);

  const pendingOrderPayments = orders
    .filter((order) => order.unpaidUsd > 0)
    .slice(0, 4)
    .map((order) => ({
      id: order.id,
      orderNo: order.orderNo,
      amountUsd: order.unpaidUsd,
      href: `/account/orders/${order.id}/pay`,
      status: order.status,
      createdAt: order.createdAt
    }));

  const pendingShippingPayments = packages
    .filter((pkg) => pkg.shippingPaymentStatus === "pending")
    .slice(0, 4)
    .map((pkg) => ({
      id: pkg.id,
      packageNo: pkg.packageNo,
      amountUsd: pkg.shippingFeeUsd,
      href: `/account/packages/${pkg.id}/pay`,
      status: pkg.packageStatus,
      createdAt: pkg.createdAt
    }));

  const transactionSummary = {
    balanceUsd: Number(user?.walletBalance ?? 0),
    rechargeUsd: transactions
      .filter((item) => item.type === "recharge")
      .reduce((sum, item) => sum + Number(item.amount), 0),
    spendUsd: Math.abs(
      transactions
        .filter((item) => Number(item.amount) < 0)
        .reduce((sum, item) => sum + Number(item.amount), 0)
    ),
    refundUsd: transactions
      .filter((item) => item.type === "refund")
      .reduce((sum, item) => sum + Number(item.amount), 0)
  };

  return {
    summary: transactionSummary,
    transactions: transactions.map((item) => ({
      id: item.id,
      transactionNo: `WTX-${item.id}`,
      type: item.type,
      amount: Number(item.amount),
      currency: item.currency,
      balanceAfter: Number(item.balanceAfter),
      note: item.note || "",
      createdAt: item.createdAt.toLocaleString(),
      relatedOrderId: item.relatedOrderId ? String(item.relatedOrderId) : undefined,
      relatedPackageId: item.relatedPackageId ? String(item.relatedPackageId) : undefined
    })),
    rechargePayments: rechargePayments.map((payment) => ({
      id: payment.id,
      paymentNo: payment.paymentNo,
      method: payment.paymentMethod || payment.provider,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      createdAt: payment.createdAt.toLocaleString()
    })),
    pendingOrderPayments,
    pendingShippingPayments
  };
}

export async function getAccountSupportWorkspace() {
  const user = await getCurrentUser();
  const dbTickets = user
    ? await prisma.supportTicket.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 8
      })
    : [];
  const mockTickets = listMockTickets();

  const ticketCards = dbTickets.length
    ? dbTickets.map((ticket) => ({
        id: String(ticket.id),
        ticketNo: ticket.ticketNo,
        subject: ticket.problemDescription,
        category: ticket.issueType,
        status: ticket.status,
        createdAt: ticket.createdAt.toLocaleString(),
        href: "/account/tickets"
      }))
    : mockTickets.slice(0, 6).map((ticket) => ({
        id: ticket.id,
        ticketNo: ticket.ticketNo,
        subject: ticket.subject,
        category: ticketCategoryLabel(ticket.category),
        status: ticket.status,
        createdAt: ticket.createdAt,
        href: `/account/tickets/${ticket.id}`
      }));

  const openCount = ticketCards.filter((ticket) => ["open", "pending", "replied"].includes(ticket.status)).length;

  return {
    summary: {
      total: ticketCards.length,
      open: openCount,
      resolved: ticketCards.filter((ticket) => ["resolved", "closed"].includes(ticket.status)).length
    },
    tickets: ticketCards,
    quickLinks: [
      {
        title: "Open tickets center",
        description: "Track replies, reopen conversations, and review your support history.",
        href: "/account/tickets"
      },
      {
        title: "Create new support ticket",
        description: "Start a new support request with order, package, payment, or account context.",
        href: "/account/tickets/new"
      },
      {
        title: "Browse help center",
        description: "Read payment, shipping, and account guidance before opening a new request.",
        href: "/account/help"
      }
    ]
  };
}

export async function getAccountCouponsWorkspace() {
  const user = await getCurrentUser();
  const orders = await getAccountOrders();
  const discountedOrders = orders
    .filter((order) => order.totalUsd > 0 && order.paidUsd >= 0)
    .slice(0, 4)
    .map((order) => ({
      id: order.id,
      orderNo: order.orderNo,
      totalUsd: order.totalUsd,
      href: `/account/orders/${order.id}`
    }));

  return {
    summary: {
      totalCoupons: shippingCoupons.length + serviceFeeDiscounts.length,
      shippingCoupons: shippingCoupons.length,
      serviceDiscounts: serviceFeeDiscounts.length,
      discountedOrders: discountedOrders.length
    },
    shippingCoupons: shippingCoupons.map((coupon) => ({
      id: coupon.id,
      discount: coupon.discount,
      validUntil: coupon.validUntil,
      minimumShippingFee: coupon.minimumShippingFee,
      applicableCountries: coupon.applicableCountries,
      applicableChannels: coupon.applicableChannels
    })),
    serviceDiscounts: serviceFeeDiscounts.map((discount) => ({
      id: discount.id,
      discount: discount.discount,
      badgeKey: discount.badgeKey
    })),
    discountedOrders,
    hasUser: Boolean(user)
  };
}
