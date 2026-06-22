import { notFound, redirect } from "next/navigation";
import { ensureCheckoutOrderFromMockOrder } from "@/lib/account/order-payment-bridge";
import { ensureOrderNotExpired } from "@/lib/account/order-cancellation";
import { prisma } from "@/lib/db";
import { requireActiveUserPage } from "@/lib/session";
import { findMockOrder } from "@/lib/account/mock-data";

type AccountOrderPayPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AccountOrderPayPage({ params }: AccountOrderPayPageProps) {
  const { id } = await params;
  const user = await requireActiveUserPage(`/account/orders/${id}/pay`);
  const realOrder = await prisma.order.findFirst({
    where: {
      userId: user.id,
      ...( /^\d+$/.test(id)
        ? { id: Number(id) }
        : { orderNo: id }),
      NOT: {
        OR: [
          { orderNo: { startsWith: "PKPAY-" } },
          { orderSource: "package_payment" }
        ]
      }
    },
    select: { id: true }
  });

  if (realOrder) {
    await ensureOrderNotExpired(realOrder.id, user.id);
    redirect(`/checkout?order=${realOrder.id}`);
  }

  const mockOrder = findMockOrder(id);
  if (!mockOrder) notFound();

  const checkoutOrder = await ensureCheckoutOrderFromMockOrder(mockOrder.id, user.id);
  redirect(`/checkout?order=${checkoutOrder.id}`);
}
