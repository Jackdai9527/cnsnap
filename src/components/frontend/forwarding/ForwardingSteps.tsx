import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { forwardingStepKeys } from "@/components/frontend/forwarding/forwarding-data";

export function ForwardingSteps() {
  const t = useTranslations("Forwarding.steps");

  return (
    <section className="site-container py-10">
      <div className="mb-5">
        <div className="label">{t("eyebrow")}</div>
        <h2 className="mt-2 text-3xl font-black text-[#101828]">{t("title")}</h2>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#667085]">{t("description")}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {forwardingStepKeys.map((key, index) => (
          <div key={key} className="rounded-2xl border border-[#dfe7f1] bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-[#101828] text-sm font-black text-white">{index + 1}</span>
              <CheckCircle2 className="size-5 text-[#0a83ff]" />
            </div>
            <h3 className="mt-4 text-base font-black text-[#101828]">{t(`items.${key}.title`)}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{t(`items.${key}.description`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
