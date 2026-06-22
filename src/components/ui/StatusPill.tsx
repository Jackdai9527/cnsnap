import { statusLabel } from "@/lib/constants";
import { useTranslations } from "next-intl";

export function StatusPill({ status }: { status?: string | null }) {
  const t = useTranslations("common.statuses");
  const value = status || "unknown";
  const tone = value.includes("pending") || value.includes("waiting")
    ? "border-[#b9822b]/40 bg-[#b9822b]/10 text-[#b9822b]"
    : value.includes("cancel") || value.includes("reject") || value === "blocked" || value === "disabled"
      ? "border-[#e60012]/40 bg-[#fff1f2] text-[#e60012]"
      : "border-jade/40 bg-jade/10 text-jade";
  return <span className={`inline-flex items-center border px-2 py-1 text-xs font-semibold ${tone}`}>{t.has(value) ? t(value) : statusLabel[value] ?? value}</span>;
}
