import { redirect } from "next/navigation";
import { ensureCheckoutOrderFromMockOrder } from "@/lib/account/order-payment-bridge";
import { mockPackages } from "@/lib/account/mock-data";
import { requireActiveUserPage } from "@/lib/session";
import { ensureCheckoutOrderFromPackage } from "@/lib/account/package-payment-bridge";

type AccountPackagePayPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AccountPackagePayPage({ params }: AccountPackagePayPageProps) {
  const { id } = await params;
  const user = await requireActiveUserPage(`/account/packages/${id}/pay`);

  if (/^\d+$/.test(id)) {
    const checkoutOrder = await ensureCheckoutOrderFromPackage(Number(id), user.id);
    redirect(`/checkout?order=${checkoutOrder.id}&source=package_shipping&package=${id}`);
  }

  const mockPackage = mockPackages.find((pkg) => pkg.id === id || pkg.packageNo === id);
  if (!mockPackage) {
    throw new Error("Package not found.");
  }

  const checkoutOrder = await ensureCheckoutOrderFromMockOrder(mockPackage.orderNo.replace(/^CN/, ""), user.id);
  redirect(`/checkout?order=${checkoutOrder.id}&source=package_shipping&package=${id}`);
}
