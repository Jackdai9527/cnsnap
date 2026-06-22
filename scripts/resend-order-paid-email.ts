import { sendOrderPaidEmail } from "@/lib/order-email";

async function main() {
  const orderNo = process.argv[2];
  if (!orderNo) {
    throw new Error("Usage: tsx scripts/resend-order-paid-email.ts <orderNo>");
  }

  const { prisma } = await import("@/lib/db");
  const order = await prisma.order.findUnique({
    where: { orderNo },
    select: { id: true }
  });

  if (!order) {
    throw new Error(`Order ${orderNo} not found.`);
  }

  await prisma.emailLog.deleteMany({
    where: {
      subject: `Payment confirmed for order ${orderNo}`,
      template: "order_paid",
      status: "failed"
    }
  });

  const result = await sendOrderPaidEmail(order.id);
  console.log(JSON.stringify(result));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
