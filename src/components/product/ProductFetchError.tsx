"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { buildBuyUrl } from "@/lib/source-url";

export function ProductFetchError({
  sourceUrl,
  message,
  locale = "en"
}: {
  sourceUrl?: string;
  message?: string;
  locale?: string;
}) {
  const t = useTranslations("product.common");
  const retryHref = sourceUrl ? buildBuyUrl(sourceUrl, locale) : `/${locale}`;

  return (
    <div className="bg-[#f5f7fb] px-4 py-12">
      <section className="mx-auto max-w-[860px] rounded-md border border-[#ffd2a6] bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row">
          <div className="grid size-12 shrink-0 place-items-center rounded-md bg-[#fff4e5] text-[#f28b00]">
            <AlertTriangle size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold uppercase text-[#e60012]">{t("fetchErrorEyebrow")}</p>
            <h1 className="mt-2 text-2xl font-black text-[#111827]">{t("fetchErrorTitle")}</h1>
            <p className="mt-3 leading-7 text-[#667085]">
              {t("fetchErrorDescription")}
            </p>
            {sourceUrl ? (
              <div className="mt-4 rounded-md bg-[#f7fbff] p-3 text-sm text-[#667085]">
                <div className="mb-1 font-bold text-[#111827]">{t("fetchErrorOriginalUrl")}</div>
                <div className="break-all">{sourceUrl}</div>
              </div>
            ) : null}
            {message ? <p className="mt-3 text-sm text-[#667085]">{message}</p> : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={retryHref} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#e60012] px-5 text-sm font-bold text-white hover:bg-[#c90000]">
                <RefreshCw size={16} />
                {t("fetchErrorRetry")}
              </Link>
              <Link href={`/${locale}`} className="inline-flex h-11 items-center justify-center rounded-md border border-[#d9e7ff] bg-white px-5 text-sm font-bold text-[#667085] hover:border-[#e60012] hover:text-[#e60012]">
                {t("fetchErrorBackHome")}
              </Link>
              <Link href="/admin/settings/api" className="inline-flex h-11 items-center justify-center rounded-md border border-[#d9e7ff] bg-white px-5 text-sm font-bold text-[#667085] hover:border-[#e60012] hover:text-[#e60012]">
                {t("fetchErrorApiSettings")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
