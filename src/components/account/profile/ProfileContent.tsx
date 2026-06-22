"use client";

import Link from "next/link";
import { WalletCards } from "lucide-react";
import { useTranslations } from "next-intl";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { MobileSectionShell } from "@/components/mobile/layout/MobileSectionShell";
import { ConnectedAccountsCard } from "@/components/account/profile/ConnectedAccountsCard";
import { ProfileDangerZone } from "@/components/account/profile/ProfileDangerZone";
import { ProfileInfoForm } from "@/components/account/profile/ProfileInfoForm";
import { ProfilePreferencesForm } from "@/components/account/profile/ProfilePreferencesForm";
import { ProfileSecurityCard } from "@/components/account/profile/ProfileSecurityCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMyProfile } from "@/hooks/account/useMyProfile";

export function ProfileContent({ sessionUserId }: { sessionUserId?: string }) {
  const t = useTranslations("account.profile");
  const { data, isLoading } = useMyProfile();

  if (isLoading || !data) {
    return (
      <>
        <MobileSectionShell title={t("title")} description={t("description")} kicker={t("title")} className="mobile-profile-page md:hidden" minimalHeader showBackButton>
          <section className="card-stack-section">
            <div className="mobile-cart-empty">
              <h2>{t("title")}</h2>
              <p>{t("loading")}</p>
            </div>
          </section>
        </MobileSectionShell>
        <div className="hidden md:block">
          <AccountPageHeader title={t("title")} description={t("description")} />
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500">{t("loading")}</div>
        </div>
      </>
    );
  }

  const { profile, connectedAccounts } = data;
  const initials = profile.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <MobileSectionShell title={t("title")} description={t("description")} kicker={t("title")} className="mobile-profile-page md:hidden" minimalHeader showBackButton>
        <section className="card-stack-section">
          <div className="mobile-account-card p-4">
            <div className="flex items-start gap-4">
              <Avatar className="size-16" size="lg">
                {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt={profile.name} /> : null}
                <AvatarFallback className="text-lg font-black">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-base font-black text-slate-950">{profile.name}</div>
                  <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">{profile.userLevel.toUpperCase()}</Badge>
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-500">{profile.email}</div>
                <div className="mt-3 grid gap-2">
                  <OverviewItem label={t("overview.defaultCurrency")} value={profile.currency} />
                  <OverviewItem label={t("overview.lastLogin")} value={profile.lastLoginAt ?? "-"} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="card-stack-section">
          <div className="mobile-account-card p-4">
            <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("walletBalance")}</div>
            <div className="mt-2 text-2xl font-black text-slate-950">${profile.walletBalance.toFixed(2)}</div>
            <Link href="/account/wallet" className="mobile-orders-action is-primary mt-4">
              <WalletCards size={16} />
              {t("viewWallet")}
            </Link>
          </div>
        </section>

        <section className="card-stack-section">
          <div className="mobile-account-list">
            <ProfileInfoForm profile={profile} />
            <ProfilePreferencesForm profile={profile} />
            <ProfileSecurityCard profile={profile} />
            <ConnectedAccountsCard accounts={connectedAccounts} profile={profile} />
            <ProfileDangerZone />
          </div>
        </section>
      </MobileSectionShell>

      <div className="hidden space-y-6 md:block">
        <AccountPageHeader
          title={t("title")}
          description={t("description")}
        />

        <Card className="border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
        <CardContent className="p-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="flex flex-col gap-5 sm:flex-row">
              <Avatar className="size-20" size="lg">
                {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt={profile.name} /> : null}
                <AvatarFallback className="text-xl font-black">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">{profile.name}</h2>
                  <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">{profile.userLevel.toUpperCase()}</Badge>
                  {profile.emailVerified ? <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">{t("emailVerified")}</Badge> : null}
                </div>
                <p className="mt-1 truncate text-sm font-semibold text-slate-500">{profile.email}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <OverviewItem label={t("overview.userId")} value={sessionUserId ?? profile.id} />
                  <OverviewItem label={t("overview.registered")} value={profile.registeredAt} />
                  <OverviewItem label={t("overview.lastLogin")} value={profile.lastLoginAt ?? "-"} />
                  <OverviewItem label={t("overview.defaultCurrency")} value={profile.currency} />
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="text-xs font-bold uppercase text-slate-400">{t("walletBalance")}</div>
              <div className="mt-2 text-3xl font-black text-slate-950">${profile.walletBalance.toFixed(2)}</div>
              <p className="mt-2 text-sm font-medium text-slate-500">{t("walletDescription")}</p>
              <Button asChild className="mt-4 w-full">
                <Link href="/account/wallet"><WalletCards />{t("viewWallet")}</Link>
              </Button>
            </div>
          </div>
        </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
          <div className="space-y-6">
            <ProfileInfoForm profile={profile} />
            <ProfilePreferencesForm profile={profile} />
          </div>
          <div className="space-y-6">
            <ProfileSecurityCard profile={profile} />
            <ConnectedAccountsCard accounts={connectedAccounts} profile={profile} />
            <ProfileDangerZone />
          </div>
        </div>
      </div>
    </>
  );
}

function OverviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase text-slate-400">{label}</div>
      <div className="mt-1 truncate text-sm font-bold text-slate-800">{value}</div>
    </div>
  );
}
