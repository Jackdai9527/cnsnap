"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProfileDangerZone() {
  const t = useTranslations("account.profile.dangerZone");
  return (
    <Card className="border-rose-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <CardHeader>
        <CardTitle className="text-rose-700">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-slate-600">
          {t("description")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <AlertDialog>
            <AlertDialogTrigger render={<button type="button" disabled />} className="inline-flex items-center justify-start gap-2 whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0">
              {t("disable")}
            </AlertDialogTrigger>
            <DangerDialog title={t("disable")} description={t("disableDescription")} />
          </AlertDialog>
          <AlertDialog>
            <AlertDialogTrigger render={<button type="button" disabled />} className="inline-flex items-center justify-start gap-2 whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0">
              {t("delete")}
            </AlertDialogTrigger>
            <DangerDialog title={t("delete")} description={t("deleteDescription")} />
          </AlertDialog>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
          {t("cannotDelete")}
        </div>
      </CardContent>
    </Card>
  );
}

function DangerDialog({ title, description }: { title: string; description: string }) {
  const t = useTranslations("account.profile.dangerZone");
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogMedia className="bg-rose-50 text-rose-700"><AlertTriangle /></AlertDialogMedia>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{t("close")}</AlertDialogCancel>
        <AlertDialogAction disabled>{t("comingSoon")}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
