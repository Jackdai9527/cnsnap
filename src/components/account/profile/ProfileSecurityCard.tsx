"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { KeyRound, LockKeyhole, MailCheck, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AccountStatusBadge } from "@/components/account/AccountStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { UserProfile } from "@/types/profile";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
  confirmPassword: z.string().min(8, "Please confirm the new password.")
}).refine((values) => values.newPassword === values.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"]
});

type PasswordValues = z.input<typeof passwordSchema>;

export function ProfileSecurityCard({ profile }: { profile: UserProfile }) {
  const t = useTranslations("account.profile.security");
  const [open, setOpen] = React.useState(false);

  return (
    <Card className="border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <SecurityItem icon={<MailCheck />} label={t("email")} value={profile.email} meta={profile.emailVerified ? <AccountStatusBadge status="verified" /> : <AccountStatusBadge status="pending" />} />
          <SecurityItem icon={<LockKeyhole />} label={t("password")} value={profile.passwordEnabled ? t("passwordEnabled") : t("noPassword")} meta={profile.passwordEnabled ? <AccountStatusBadge status="enabled" /> : <AccountStatusBadge status="pending" />} />
          <SecurityItem icon={<KeyRound />} label={t("lastPasswordChange")} value={profile.passwordEnabled ? "2026-06-02 11:15" : t("notAvailable")} />
          <SecurityItem icon={<ShieldCheck />} label={t("twoFactor")} value={profile.twoFactorEnabled ? "Enabled" : t("comingSoon")} meta={<AccountStatusBadge status={profile.twoFactorEnabled ? "enabled" : "pending"} />} />
        </div>
        {!profile.passwordEnabled ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
            {t("googleOnlyWarning")}
          </div>
        ) : null}
        <Separator />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/login" className="text-sm font-bold text-sky-700 hover:underline">{t("forgotPassword")}</Link>
          <Button onClick={() => setOpen(true)}>{t("changePassword")}</Button>
        </div>
      </CardContent>
      <ChangePasswordDialog open={open} onOpenChange={setOpen} />
    </Card>
  );
}

function SecurityItem({ icon, label, value, meta }: { icon: React.ReactNode; label: string; value: string; meta?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-sky-600">{icon}</span>
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase text-slate-400">{label}</div>
            <div className="mt-1 truncate text-sm font-bold text-slate-800">{value}</div>
          </div>
        </div>
        {meta}
      </div>
    </div>
  );
}

function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const securityT = useTranslations("account.profile.security");
  const t = useTranslations("account.profile.security.dialog");
  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" }
  });

  function onSubmit() {
    // TODO: replace with changePassword server action.
    toast.success(securityT("passwordUpdated"));
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField control={form.control} name="currentPassword" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("currentPassword")}</FormLabel>
                <FormControl><Input type="password" autoComplete="current-password" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="newPassword" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("newPassword")}</FormLabel>
                <FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="confirmPassword" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("confirmPassword")}</FormLabel>
                <FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
              <Button type="submit">{t("save")}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
