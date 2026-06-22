import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { AccountPackagesTable } from "@/components/account/packages/AccountPackagesTable";
import { getAccountPackages } from "@/lib/account/packages";
import { getTranslations } from "next-intl/server";

export default async function AccountPackagesPage() {
  const t = await getTranslations("account.packages.page");
  const packages = await getAccountPackages();

  return (
    <>
      <div className="md:hidden">
        <AccountPackagesTable data={packages} title={t("title")} description={t("description")} />
      </div>
      <div className="hidden md:block">
        <AccountPageHeader
          title={t("title")}
          description={t("description")}
        />
        <AccountPackagesTable data={packages} title={t("title")} description={t("description")} />
      </div>
    </>
  );
}
