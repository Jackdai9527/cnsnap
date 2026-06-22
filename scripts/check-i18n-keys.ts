import { promises as fs } from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const root = path.join(process.cwd(), "messages", "frontend");
const baseLocale = "en";

function isObject(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function flattenKeys(input: JsonRecord, prefix = ""): string[] {
  return Object.entries(input).flatMap(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (isObject(value)) {
      return flattenKeys(value, nextKey);
    }
    return [nextKey];
  });
}

async function readNamespaceFiles(locale: string) {
  const directory = path.join(root, locale);

  try {
    const files = (await fs.readdir(directory)).filter((file) => file.endsWith(".json")).sort();
    const entries = await Promise.all(
      files.map(async (file) => {
        const raw = await fs.readFile(path.join(directory, file), "utf8");
        return [path.basename(file, ".json"), JSON.parse(raw)] as const;
      })
    );

    return Object.fromEntries(entries) as JsonRecord;
  } catch {
    return {};
  }
}

async function main() {
  const locales = (await fs.readdir(root)).filter((entry) => entry !== baseLocale).sort();
  const baseMessages = await readNamespaceFiles(baseLocale);
  const baseKeys = new Set(flattenKeys(baseMessages));
  let hasIssues = false;

  for (const locale of locales) {
    const localeMessages = await readNamespaceFiles(locale);
    const localeKeys = new Set(flattenKeys(localeMessages));

    const missing = [...baseKeys].filter((key) => !localeKeys.has(key));
    const extra = [...localeKeys].filter((key) => !baseKeys.has(key));

    if (!missing.length && !extra.length) {
      console.log(`${locale}: OK`);
      continue;
    }

    hasIssues = true;
    console.log(`${locale}:`);
    if (missing.length) {
      console.log(`  Missing keys (${missing.length}):`);
      for (const key of missing) console.log(`    - ${key}`);
    }
    if (extra.length) {
      console.log(`  Extra keys (${extra.length}):`);
      for (const key of extra) console.log(`    + ${key}`);
    }
  }

  if (hasIssues) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
