import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

import { restrictionKeys } from "@/components/frontend/forwarding/forwarding-data";

export function ForwardingRestrictions() {
  const t = useTranslations("Forwarding.restrictions");

  return (
    <section className="site-container py-10">
      <div className="rounded-[30px] border border-[#fedf89] bg-[#fffbeb] p-5 shadow-[0_20px_55px_rgba(180,83,9,0.08)] md:p-6">
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-[#b54708]">
              <AlertTriangle size={14} />
              {t("eyebrow")}
            </div>
            <h2 className="mt-3 text-3xl font-black text-[#101828]">{t("title")}</h2>
            <p className="mt-3 text-sm font-semibold leading-7 text-[#667085]">{t("description")}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {restrictionKeys.map((key) => (
              <div key={key} className="rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-[#344054] shadow-[0_10px_25px_rgba(180,83,9,0.05)]">
                {t(`items.${key}`)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
