import pino from "pino";

type LogContext = Record<string, unknown>;

const sensitiveKeyPattern = /password|secret|token|authorization|auth|api[_-]?key|card|cvv|cvc|pan|oauth|cookie|set-cookie/i;

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "development" ? "debug" : "info"),
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "SYS:standard"
          }
        }
      : undefined,
  redact: {
    paths: [
      "*.password",
      "*.passwordHash",
      "*.apiSecret",
      "*.secret",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
      "*.authorization",
      "*.card",
      "*.cardNumber",
      "*.cvv",
      "*.cvc",
      "password",
      "passwordHash",
      "apiSecret",
      "secret",
      "token",
      "accessToken",
      "refreshToken",
      "authorization",
      "card",
      "cardNumber",
      "cvv",
      "cvc"
    ],
    censor: "[REDACTED]"
  }
});

export function logError(error: unknown, context: LogContext = {}) {
  const normalizedError = normalizeError(error);
  logger.error({ ...sanitizeLogContext(context), err: normalizedError }, normalizedError.message);
}

export function logApiRequest(context: {
  method?: string;
  path?: string;
  endpoint?: string;
  platform?: string;
  durationMs?: number;
  status?: number | string;
  success?: boolean;
  error?: unknown;
  requestId?: string;
  meta?: LogContext;
}) {
  const payload = sanitizeLogContext({
    method: context.method,
    path: context.path,
    endpoint: context.endpoint,
    platform: context.platform,
    durationMs: context.durationMs,
    status: context.status,
    success: context.success,
    requestId: context.requestId,
    meta: context.meta,
    error: context.error ? normalizeError(context.error) : undefined
  });
  const message = `${context.method ?? "API"} ${context.path ?? context.endpoint ?? "request"} ${context.success === false ? "failed" : "completed"}`;
  if (context.success === false) {
    logger.warn(payload, message);
    return;
  }
  logger.info(payload, message);
}

export function sanitizeLogContext<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogContext(item)) as T;
  }
  if (!value || typeof value !== "object") return value;
  if (value instanceof Error) return normalizeError(value) as T;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [
      key,
      sensitiveKeyPattern.test(key) ? "[REDACTED]" : sanitizeLogContext(entryValue)
    ])
  ) as T;
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack
    };
  }
  return {
    name: "Error",
    message: String(error)
  };
}
