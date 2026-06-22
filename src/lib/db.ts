import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function hasCurrentDelegates(client: PrismaClient | undefined) {
  if (!client) return false;
  return (
    "supportTicket" in client &&
    "valueAddedService" in client &&
    "frontendContentBlock" in client &&
    "frontendContentBlockDescription" in client
  );
}

export const prisma =
  (hasCurrentDelegates(globalForPrisma.prisma) ? globalForPrisma.prisma : undefined) ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
