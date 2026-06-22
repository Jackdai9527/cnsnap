"use client";

import { Mail, Unlink } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AccountStatusBadge } from "@/components/account/AccountStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConnectedAccount, UserProfile } from "@/types/profile";

export function ConnectedAccountsCard({ accounts, profile }: { accounts: ConnectedAccount[]; profile: UserProfile }) {
  const t = useTranslations("account.profile.connectedAccounts");
  const google = accounts.find((account) => account.provider === "google");
  const connected = google?.status === "connected";
  const cannotDisconnect = connected && !profile.passwordEnabled;

  return (
    <Card className="border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-sky-600">
                <Mail className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-black text-slate-950">{t("google")}</div>
                  <AccountStatusBadge status={connected ? "connected" : "disconnected"} />
                </div>
                <div className="mt-1 truncate text-sm font-medium text-slate-500">
                  {connected ? t("connectedAt", { email: google.providerEmail, date: google.connectedAt }) : t("noGoogle")}
                </div>
                {cannotDisconnect ? <p className="mt-2 text-xs font-semibold text-amber-700">{t("disconnectWarning")}</p> : null}
              </div>
            </div>
            {connected ? (
              <Button variant="outline" disabled={cannotDisconnect} onClick={() => toast.info(t("disconnectInfo"))}>
                <Unlink />{t("disconnect")}
              </Button>
            ) : (
              <Button onClick={() => toast.info(t("connectInfo"))}>{t("connect")}</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
