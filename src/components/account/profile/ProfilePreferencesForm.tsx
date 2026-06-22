"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getEnabledFrontendLocaleConfigs } from "../../../../config/i18n";
import type { UserProfile } from "@/types/profile";

const languageOptions = getEnabledFrontendLocaleConfigs().map((locale) => ({
  label: locale.nativeName,
  value: locale.locale
}));

const timezoneOptions = ["UTC", "America/Los_Angeles", "America/New_York", "Europe/Berlin", "Europe/Paris", "Asia/Shanghai", "Asia/Tokyo", "Asia/Seoul"];

const preferencesSchema = z.object({
  language: z.string().min(1),
  currency: z.enum(["USD", "CNY"]),
  timezone: z.string().min(1),
  emailNotifications: z.boolean(),
  marketingEmails: z.boolean()
});

type PreferencesValues = z.input<typeof preferencesSchema>;

export function ProfilePreferencesForm({ profile }: { profile: UserProfile }) {
  const t = useTranslations("account.profile.preferences");
  const form = useForm<PreferencesValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      language: profile.language,
      currency: profile.currency,
      timezone: profile.timezone,
      emailNotifications: profile.emailNotifications,
      marketingEmails: profile.marketingEmails
    }
  });
  const emailNotifications = useWatch({ control: form.control, name: "emailNotifications" });
  const marketingEmails = useWatch({ control: form.control, name: "marketingEmails" });

  function onSubmit(values: PreferencesValues) {
    // TODO: replace with updateMyPreferences action and persist selected language/currency to user preferences.
    localStorage.setItem("cnsnap_language", values.language);
    localStorage.setItem("cnsnap_currency", values.currency);
    toast.success(t("saved"));
  }

  return (
    <Card className="border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField control={form.control} name="language" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("language")}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9 w-full bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {languageOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="currency" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("currency")}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9 w-full bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="CNY">CNY</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="timezone" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("timezone")}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9 w-full bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {timezoneOptions.map((timezone) => <SelectItem key={timezone} value={timezone}>{timezone}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid gap-3">
              <SwitchField
                label={t("orderEmails")}
                description={t("orderEmailsDescription")}
                checked={emailNotifications}
                onCheckedChange={(checked) => form.setValue("emailNotifications", checked, { shouldDirty: true })}
              />
              <SwitchField
                label={t("marketingEmails")}
                description={t("marketingEmailsDescription")}
                checked={marketingEmails}
                onCheckedChange={(checked) => form.setValue("marketingEmails", checked, { shouldDirty: true })}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit">{t("save")}</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function SwitchField({ label, description, checked, onCheckedChange }: { label: string; description: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div>
        <div className="text-sm font-bold text-slate-800">{label}</div>
        <div className="mt-1 text-xs leading-5 text-slate-500">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={(value) => onCheckedChange(Boolean(value))} />
    </div>
  );
}
