"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { SeoSettings } from "@/modules/seo/types";

const settingsSchema = z.object({
  siteName: z.string().trim().min(1, "Site name is required."),
  defaultTitle: z.string().trim().min(1, "Default title is required."),
  titleTemplate: z.string().trim().min(1, "Title template is required."),
  defaultDescription: z.string().trim().min(1, "Default description is required."),
  defaultOgImage: z.string().trim().min(1, "Default OG image is required."),
  defaultTwitterImage: z.string().trim().min(1, "Default Twitter image is required."),
  defaultRobots: z.enum(["index,follow", "noindex,follow", "noindex,nofollow"]),
  canonicalBaseUrl: z.string().trim().min(1, "Canonical base URL is required."),
  googleSiteVerification: z.string().optional(),
  googleAnalyticsId: z.string().optional(),
  googleTagManagerId: z.string().optional()
});

type SettingsValues = z.infer<typeof settingsSchema>;

export function SeoSettingsForm({ settings, action }: { settings: SeoSettings; action: (formData: FormData) => Promise<void> }) {
  const t = useTranslations("seo.settingsForm");
  const commonSave = useTranslations("common.saveForm");
  const [isPending, startTransition] = useTransition();
  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      siteName: settings.siteName,
      defaultTitle: settings.defaultTitle,
      titleTemplate: settings.titleTemplate,
      defaultDescription: settings.defaultDescription,
      defaultOgImage: settings.defaultOgImage,
      defaultTwitterImage: settings.defaultTwitterImage,
      defaultRobots: settings.defaultRobots,
      canonicalBaseUrl: settings.canonicalBaseUrl,
      googleSiteVerification: settings.googleSiteVerification,
      googleAnalyticsId: settings.googleAnalyticsId,
      googleTagManagerId: settings.googleTagManagerId
    }
  });

  function submit(values: SettingsValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, value || ""));

    startTransition(async () => {
      try {
        await action(formData);
        toast.success(t("saved"));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("saveFailed"));
      }
    });
  }

  return (
    <form className="admin-card grid gap-5 p-6" onSubmit={form.handleSubmit((values) => submit(values))}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("fields.siteName")} error={form.formState.errors.siteName?.message}>
          <input {...form.register("siteName")} className="input h-11" />
        </Field>
        <Field label={t("fields.canonicalBaseUrl")} error={form.formState.errors.canonicalBaseUrl?.message}>
          <input {...form.register("canonicalBaseUrl")} className="input h-11" />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("fields.defaultTitle")} error={form.formState.errors.defaultTitle?.message}>
          <input {...form.register("defaultTitle")} className="input h-11" />
        </Field>
        <Field label={t("fields.titleTemplate")} error={form.formState.errors.titleTemplate?.message}>
          <input {...form.register("titleTemplate")} className="input h-11" placeholder={t("placeholders.titleTemplate")} />
        </Field>
      </div>

      <Field label={t("fields.defaultDescription")} error={form.formState.errors.defaultDescription?.message}>
        <textarea {...form.register("defaultDescription")} className="input min-h-[110px] py-3" />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("fields.defaultOgImage")} error={form.formState.errors.defaultOgImage?.message}>
          <input {...form.register("defaultOgImage")} className="input h-11" />
        </Field>
        <Field label={t("fields.defaultTwitterImage")} error={form.formState.errors.defaultTwitterImage?.message}>
          <input {...form.register("defaultTwitterImage")} className="input h-11" />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("fields.defaultRobots")}>
          <select {...form.register("defaultRobots")} className="input h-11">
            <option value="index,follow">index,follow</option>
            <option value="noindex,follow">noindex,follow</option>
            <option value="noindex,nofollow">noindex,nofollow</option>
          </select>
        </Field>
        <Field label={t("fields.googleSiteVerification")}>
          <input {...form.register("googleSiteVerification")} className="input h-11" />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("fields.googleAnalyticsId")}>
          <input {...form.register("googleAnalyticsId")} className="input h-11" />
        </Field>
        <Field label={t("fields.googleTagManagerId")}>
          <input {...form.register("googleTagManagerId")} className="input h-11" />
        </Field>
      </div>

      <div className="flex items-center justify-end border-t border-slate-200 pt-4">
        <Button type="submit" className="rounded-full bg-[#ff1d5e] px-5 font-black text-white hover:bg-[#e21654]" disabled={isPending}>
          {isPending ? commonSave("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-slate-900">{label}</span>
      {children}
      {error ? <span className="text-xs font-bold text-red-600">{error}</span> : null}
    </label>
  );
}
