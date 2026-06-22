import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logger, sanitizeLogContext } from "@/lib/logger";

type AuditValue = Prisma.InputJsonValue | null | undefined;

type AuditLogInput = {
  actorId?: number | null;
  actorEmail?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | number | null;
  targetLabel?: string | null;
  oldValue?: AuditValue;
  newValue?: AuditValue;
  ip?: string | null;
  userAgent?: string | null;
  message?: string | null;
  orderId?: number | null;
  detail?: string | null;
};

export async function createAuditLog(input: AuditLogInput) {
  const requestMeta = await getRequestMeta();
  const data = {
    actorId: input.actorId ?? undefined,
    actorEmail: input.actorEmail ?? undefined,
    action: input.action,
    targetType: input.targetType ?? undefined,
    targetId: input.targetId == null ? undefined : String(input.targetId),
    targetLabel: input.targetLabel ?? undefined,
    oldValue: toJson(input.oldValue),
    newValue: toJson(input.newValue),
    ip: input.ip ?? requestMeta.ip,
    userAgent: input.userAgent ?? requestMeta.userAgent,
    message: input.message ?? input.detail ?? undefined,
    orderId: input.orderId ?? undefined,
    detail: input.detail ?? input.message ?? undefined
  };

  logger.info(
    sanitizeLogContext({
      event: "operation_log",
      action: data.action,
      actorId: data.actorId,
      actorEmail: data.actorEmail,
      targetType: data.targetType,
      targetId: data.targetId,
      targetLabel: data.targetLabel
    }),
    "Operation audit log recorded"
  );

  return prisma.operationLog.create({ data });
}

export function auditSnapshot<T extends Record<string, unknown>>(value: T): Prisma.InputJsonObject {
  return sanitizeLogContext(value) as Prisma.InputJsonObject;
}

function toJson(value: AuditValue) {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return sanitizeLogContext(value) as Prisma.InputJsonValue;
}

async function getRequestMeta() {
  try {
    const headerStore = await headers();
    const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
    return {
      ip: forwardedFor || headerStore.get("x-real-ip") || undefined,
      userAgent: headerStore.get("user-agent") || undefined
    };
  } catch {
    return {
      ip: undefined,
      userAgent: undefined
    };
  }
}
