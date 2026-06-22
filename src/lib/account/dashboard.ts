import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { mockAccountUser, mockOrders, mockPackages } from "@/lib/account/mock-data";
import { getAccountOrders } from "@/lib/account/orders";
import { getAccountPackages } from "@/lib/account/packages";
import { getLocaleNativeNameRuntime } from "@/lib/i18n/locale-config-store";
import { resolveFrontendLocale } from "@/lib/i18n/runtime";

export async function getAccountDashboard() {
  const user = await getCurrentUser();
  const currentLocale = await resolveFrontendLocale();
  const liveOrders = await getAccountOrders();
  const livePackages = await getAccountPackages();
  const orders = user ? liveOrders : mockOrders;
  const packages = user ? livePackages : mockPackages;
  const firstPendingPaymentOrder = orders.find((order) => order.status === "pending_payment" && order.unpaidUsd > 0);
  const firstPendingShippingPackage = packages.find((pkg) => pkg.shippingPaymentStatus === "pending");
  const language = await getLocaleNativeNameRuntime(currentLocale);

  const accountUser = user
    ? {
        name: user.name || user.email.split("@")[0],
        email: user.email,
        avatarUrl: user.avatarUrl || undefined,
        walletBalanceUsd: Number(user.walletBalance),
        frozenAmountUsd: 0,
        language,
        currency: (user.currency as "USD" | "EUR" | "CNY") || "USD",
        referralCode: user.referralCode
      }
    : {
        ...mockAccountUser,
        language
      };

  return {
    user: accountUser,
    orders,
    packages,
    pendingPaymentOrders: orders.filter((order) => order.status === "pending_payment").length,
    waitingShippingPaymentPackages: packages.filter((pkg) => pkg.shippingPaymentStatus === "pending").length,
    inTransitPackages: packages.filter((pkg) => pkg.packageStatus === "shipped").length,
    pendingOrderAction: firstPendingPaymentOrder
      ? {
          orderId: firstPendingPaymentOrder.id,
          orderNo: firstPendingPaymentOrder.orderNo,
          amountUsd: firstPendingPaymentOrder.unpaidUsd,
          href: `/account/orders/${encodeURIComponent(firstPendingPaymentOrder.id)}/pay`
        }
      : null,
    pendingShippingAction: firstPendingShippingPackage
      ? {
          packageId: firstPendingShippingPackage.id,
          packageNo: firstPendingShippingPackage.packageNo,
          orderNo: firstPendingShippingPackage.orderNo,
          amountUsd: firstPendingShippingPackage.shippingFeeUsd,
          href: `/account/packages/${encodeURIComponent(firstPendingShippingPackage.id)}/pay`
        }
      : null
  };
}
