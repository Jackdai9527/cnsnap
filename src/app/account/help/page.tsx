import { getLocale } from "next-intl/server";
import { AccountHelpContent } from "@/components/account/help/AccountHelpContent";
import { getHelpCenterData } from "@/lib/help-center-service";

export default async function AccountHelpPage() {
  const locale = await getLocale();
  const data = await getHelpCenterData(locale);
  return <AccountHelpContent {...data} />;
}
