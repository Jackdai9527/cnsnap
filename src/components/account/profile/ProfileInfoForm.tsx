"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { UserProfile } from "@/types/profile";

const profileInfoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  telegram: z.string().optional(),
  avatarUrl: z.string().url("Please enter a valid avatar URL.").optional().or(z.literal(""))
});

type ProfileInfoValues = z.input<typeof profileInfoSchema>;

export function ProfileInfoForm({ profile }: { profile: UserProfile }) {
  const t = useTranslations("account.profile.basicInfo");
  const form = useForm<ProfileInfoValues>({
    resolver: zodResolver(profileInfoSchema),
    defaultValues: {
      name: profile.name,
      phone: profile.phone ?? "",
      whatsapp: profile.whatsapp ?? "",
      telegram: profile.telegram ?? "",
      avatarUrl: profile.avatarUrl ?? ""
    }
  });

  function onSubmit() {
    // TODO: replace with updateMyProfile server action.
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
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("name")}</FormLabel>
                <FormControl><Input placeholder={t("namePlaceholder")} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("phone")}</FormLabel>
                  <FormControl><Input placeholder={t("phonePlaceholder")} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="whatsapp" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("whatsapp")}</FormLabel>
                  <FormControl><Input placeholder={t("whatsappPlaceholder")} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="telegram" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("telegram")}</FormLabel>
                  <FormControl><Input placeholder={t("telegramPlaceholder")} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="avatarUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("avatarUrl")}</FormLabel>
                  <FormControl><Input placeholder={t("avatarPlaceholder")} {...field} /></FormControl>
                  <FormDescription>{t("avatarHelp")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
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
