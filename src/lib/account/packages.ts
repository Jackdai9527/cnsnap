import { prisma } from "@/lib/db";
import { countryName } from "@/lib/countries";
import type { AccountPackage } from "@/lib/account/mock-data";
import { getCurrentUser } from "@/lib/session";

export type RealAccountPackage = AccountPackage & {
  orderId?: string;
};

export async function getAccountPackages(): Promise<RealAccountPackage[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const packages = await prisma.package.findMany({
    where: { userId: user.id },
    include: {
      order: {
        select: {
          orderNo: true,
          shippingPaymentStatus: true,
          address: {
            select: {
              country: true
            }
          }
        }
      },
      shippingChannel: {
        select: {
          name: true
        }
      },
      items: true
    },
    orderBy: { createdAt: "desc" }
  });

  return packages.map((pkg) => {
    const length = Number(pkg.lengthCm ?? 0);
    const width = Number(pkg.widthCm ?? 0);
    const height = Number(pkg.heightCm ?? 0);
    const actualWeight = Number(pkg.weightKg);
    const volumetricWeight = length > 0 && width > 0 && height > 0 ? (length * width * height) / 5000 : 0;
    const chargeableWeight = Math.max(actualWeight, volumetricWeight);
    const packageStatus = mapPackageStatus(pkg.status);
    const shippingPaymentStatus = mapShippingPaymentStatus(pkg.order?.shippingPaymentStatus, pkg.status);

    return {
      id: String(pkg.id),
      packageNo: pkg.packageNo,
      orderId: pkg.orderId ? String(pkg.orderId) : undefined,
      orderNo: pkg.order?.orderNo ?? "-",
      createdAt: pkg.createdAt.toLocaleString(),
      packageStatus,
      itemCount: pkg.items.reduce((sum, item) => sum + item.quantity, 0),
      actualWeightKg: actualWeight,
      dimensions: length && width && height ? `${length} x ${width} x ${height} cm` : "-",
      chargeableWeightKg: chargeableWeight,
      destinationCountry: countryName(pkg.order?.address?.country) || pkg.order?.address?.country || "-",
      shippingChannel: pkg.shippingChannel?.name ?? "-",
      shippingFeeUsd: Number(pkg.shippingFeeUsd),
      shippingPaymentStatus,
      trackingNumber: pkg.trackingNumber ?? undefined,
      shippedAt: pkg.shippedAt?.toLocaleString()
    };
  });
}

function mapPackageStatus(status: string): AccountPackage["packageStatus"] {
  if (status === "shipping_paid") return "shipping_paid";
  if (status === "shipped") return "shipped";
  if (status === "delivered") return "delivered";
  if (status === "abnormal" || status === "returned" || status === "cancelled") return "exception";
  return "waiting_shipping_payment";
}

function mapShippingPaymentStatus(orderStatus?: string | null, packageStatus?: string | null): AccountPackage["shippingPaymentStatus"] {
  if (packageStatus === "shipping_paid" || packageStatus === "shipped" || packageStatus === "delivered") return "paid";
  if (packageStatus === "waiting_shipping_payment") return "pending";
  if (orderStatus === "paid" || orderStatus === "international_freight_paid") return "paid";
  if (orderStatus === "pending" || orderStatus === "international_freight_pending") return "pending";
  return "none";
}
