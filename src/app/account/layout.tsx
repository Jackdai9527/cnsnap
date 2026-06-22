import type { Metadata } from "next";
import { AccountHeader } from "@/components/account/AccountHeader";
import { AccountQueryProvider } from "@/components/account/AccountQueryProvider";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { Toaster } from "@/components/ui/sonner";
import { mockAccountUser, type AccountUser } from "@/lib/account/mock-data";
import { getLocaleNativeNameRuntime } from "@/lib/i18n/locale-config-store";
import { resolveFrontendLocale } from "@/lib/i18n/runtime";
import { getCurrentUser } from "@/lib/session";
import { createMetadataFromIndexPolicy } from "@/modules/seo/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await createMetadataFromIndexPolicy("/account", {
    title: "Account Center",
    description: "Manage orders, packages, addresses, wallet, and support."
  });
  return seo.metadata;
}

async function resolveAccountHeaderUser(): Promise<AccountUser> {
  const [currentUser, currentLocale] = await Promise.all([getCurrentUser(), resolveFrontendLocale()]);
  const language = await getLocaleNativeNameRuntime(currentLocale);

  if (!currentUser) {
    return {
      ...mockAccountUser,
      language
    };
  }

  return {
    name: currentUser.name || currentUser.email.split("@")[0],
    email: currentUser.email,
    avatarUrl: currentUser.avatarUrl || undefined,
    walletBalanceUsd: Number(currentUser.walletBalance),
    frozenAmountUsd: 0,
    language,
    currency: (currentUser.currency as AccountUser["currency"]) || "USD",
    referralCode: currentUser.referralCode
  };
}

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const accountUser = await resolveAccountHeaderUser();

  return (
    <AccountQueryProvider>
      <div className="account-shell min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#fff7fb_45%,#ffffff_100%)]">
        <AccountHeader user={accountUser} />
        <div className="mx-auto grid w-full max-w-[1500px] gap-6 px-4 py-6 md:px-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <AccountSidebar className="sticky top-24 hidden h-fit lg:block" />
          <main className="min-w-0 pb-10">{children}</main>
        </div>
        <Toaster richColors position="top-right" />
      </div>
    </AccountQueryProvider>
  );
}
