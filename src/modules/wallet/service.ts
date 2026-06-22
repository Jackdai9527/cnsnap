import { prisma } from "@/lib/db";
import { roundMoney } from "@/lib/currency";

export async function adjustWallet(userId: number, amount: number, type: string, note?: string, createdBy?: number) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const balanceAfter = roundMoney(Number(user.walletBalance) + amount);
  await prisma.user.update({
    where: { id: userId },
    data: { walletBalance: balanceAfter }
  });
  return prisma.walletTransaction.create({
    data: {
      userId,
      type,
      amount,
      balanceAfter,
      note,
      createdBy
    }
  });
}
