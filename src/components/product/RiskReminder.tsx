import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

export function RiskReminder({ riskCount = 1 }: { riskCount?: number }) {
  const t = useTranslations("search.riskReminder");
  return (
    <div className="dialogRisk-wrap fixed inset-0 z-[80] grid place-items-center bg-[#111827]/55 px-4 py-10">
      <section className="dialogRisk w-full max-w-[640px] overflow-hidden rounded-[24px] bg-white shadow-[0_30px_90px_rgba(23,20,31,0.28)]">
        <header className="border-b border-[#d9e7ff] bg-[#f7fbff] px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-600">
              <AlertTriangle size={23} />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#111827]">{t("title")}</h1>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">
                {t("subtitle", {
                  count: riskCount,
                  label: riskCount === 1 ? t("riskSingle") : t("riskPlural")
                })}
              </p>
            </div>
          </div>
        </header>
        <div className="dialogRisk-body px-6 py-5">
          <dl className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <dt className="font-black text-amber-900">{t("alertTitle")}</dt>
            <dd className="mt-2 text-sm font-semibold leading-7 text-amber-800">
              {t("alertDescription")}
            </dd>
          </dl>
        </div>
        <footer className="border-t border-[#d9e7ff] px-6 py-5">
          <Link href="/" className="btn-primary rounded-xl px-5 py-3">
            {t("continueShopping")}
          </Link>
        </footer>
      </section>
    </div>
  );
}

export function SearchRiskNoResults() {
  const t = useTranslations("search.riskReminder");
  return (
    <section className="aSearch-noResult-tips site-card mt-6 p-7">
      <h2 className="text-2xl font-black text-[#111827]">
        {t("noResultTitle")}
      </h2>
      <dl className="mt-5 space-y-3 text-sm font-semibold leading-6 text-[#667085]">
        <dt className="font-black text-[#111827]">{t("suggestTitle")}</dt>
        <dd>{t("suggestions.one")}</dd>
        <dd>{t("suggestions.two")}</dd>
        <dd>{t("suggestions.three")}</dd>
        <dd>{t("suggestions.four")}</dd>
        <dd>{t("suggestions.five")}</dd>
      </dl>
    </section>
  );
}
