import { getTranslations } from "next-intl/server";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { MobileSectionShell } from "@/components/mobile/layout/MobileSectionShell";
import { DiyOrderForm } from "@/components/frontend/diy/DiyOrderForm";

export default async function AccountNewDiyOrderPage() {
  const t = await getTranslations("account.diyOrders.newPage");

  return (
    <>
      <MobileSectionShell
        title={t("title")}
        description={t("description")}
        kicker={t("title")}
        className="md:hidden"
        minimalHeader
        showBackButton
      >
        <section className="card-stack-section">
          <DiyOrderForm />
        </section>
      </MobileSectionShell>

      <div className="hidden md:block">
        <AccountPageHeader
          title={t("title")}
          description={t("description")}
        />
        <DiyOrderForm />
      </div>
    </>
  );
}
