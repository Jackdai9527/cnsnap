import { promises as fs } from "node:fs";
import path from "node:path";
import { cache } from "react";
import type { AbstractIntlMessages } from "next-intl";
import { defaultLocale, getAppLocaleBySeoLocale, type AppLocale } from "../../../config/i18n";

export type MessageNamespace = "admin" | "frontend";

type JsonRecord = Record<string, unknown>;

const frontendAliasMap: Record<string, string> = {
  nav: "MainNav",
  auth: "AuthPage",
  cart: "CartPage",
  checkout: "CheckoutPage",
  estimation: "Estimation",
  promotion: "Promotion",
  "diy-order": "DiyOrder",
  forwarding: "Forwarding",
  help: "HelpCenter"
};

const MESSAGE_ROOT = path.join(process.cwd(), "messages");

async function readJsonFile(filePath: string) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as JsonRecord;
}

function isObject(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(base: JsonRecord, override: JsonRecord): JsonRecord {
  const result: JsonRecord = { ...base };

  for (const [key, value] of Object.entries(override)) {
    if (isObject(value) && isObject(result[key])) {
      result[key] = deepMerge(result[key] as JsonRecord, value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

async function readDirectoryMessages(namespace: MessageNamespace, locale: AppLocale) {
  const directory = path.join(MESSAGE_ROOT, namespace, locale);

  try {
    const files = (await fs.readdir(directory)).filter((file) => file.endsWith(".json")).sort();
    const parts = await Promise.all(files.map(async (file) => {
      const filePath = path.join(directory, file);
      const content = await readJsonFile(filePath);
      return [path.basename(file, ".json"), content] as const;
    }));

    const messages = Object.fromEntries(parts) as JsonRecord;

    if (namespace === "frontend") {
      for (const [sourceKey, aliasKey] of Object.entries(frontendAliasMap)) {
        if (messages[sourceKey] && !messages[aliasKey]) {
          messages[aliasKey] = messages[sourceKey];
        }
      }
    }

    return messages;
  } catch {
    return {};
  }
}

function resolveMessageLocale(locale: AppLocale) {
  return (getAppLocaleBySeoLocale(locale) ?? locale) as AppLocale;
}

const readLegacyFrontendMessages = cache(async () => {
  const legacyPath = path.join(MESSAGE_ROOT, "en.json");

  try {
    const legacy = await readJsonFile(legacyPath);
    return legacy as JsonRecord;
  } catch {
    return {};
  }
});

export const getNamespaceMessages = cache(async (namespace: MessageNamespace, locale: AppLocale): Promise<AbstractIntlMessages> => {
  const fallbackLocale = defaultLocale as AppLocale;
  const requestedLocale = resolveMessageLocale(locale);
  const [fallbackMessages, requestedMessages] = await Promise.all([
    readDirectoryMessages(namespace, fallbackLocale),
    requestedLocale === fallbackLocale ? Promise.resolve({}) : readDirectoryMessages(namespace, requestedLocale)
  ]);

  const merged = deepMerge(fallbackMessages, requestedMessages);

  if (namespace === "frontend") {
    const legacy = await readLegacyFrontendMessages();
    return deepMerge(legacy, merged) as AbstractIntlMessages;
  }

  return merged as AbstractIntlMessages;
});

export async function getMergedMessages(locale: AppLocale, namespaces: MessageNamespace[]) {
  const parts = await Promise.all(namespaces.map((namespace) => getNamespaceMessages(namespace, locale)));
  return parts.reduce<JsonRecord>((accumulator, current) => deepMerge(accumulator, current as JsonRecord), {}) as AbstractIntlMessages;
}
