"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Edit3, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSeoPageEditor, type SeoPageEditorValues } from "@/modules/seo/hooks/useSeoPageEditor";
import type { SeoPageRecord } from "@/modules/seo/types";

type SeoPageEditorDialogProps = {
  page: SeoPageRecord;
  action: (formData: FormData) => Promise<void>;
};

export function SeoPageEditorDialog({ page, action }: SeoPageEditorDialogProps) {
  const t = useTranslations("seo.pageEditor");
  const commonSave = useTranslations("common.saveForm");
  const form = useSeoPageEditor(page);
  const [isPending, startTransition] = useTransition();
  const locked = page.lockedNoindex;

  function submit(values: SeoPageEditorValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.set(key, typeof value === "boolean" ? String(value) : value ?? "");
    });

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
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" className="h-8 rounded-full border-slate-200 px-3 font-bold" />}>
        <Edit3 size={14} />
        {t("edit")}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[min(1120px,calc(100vw-2rem))] max-w-none overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-0 text-slate-950 shadow-[0_24px_80px_rgba(15,23,42,0.16)] sm:max-w-none">
        <DialogHeader className="border-b border-slate-200 px-6 py-5">
          <DialogTitle className="text-xl font-black text-slate-950">{t("title")}</DialogTitle>
          <DialogDescription className="text-sm font-semibold text-slate-500">
            {t("description", { path: page.path })}
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-5 px-6 py-5"
          onSubmit={form.handleSubmit((values) => submit(values))}
        >
          <input type="hidden" {...form.register("id")} />
          <input type="hidden" {...form.register("path")} />
          <input type="hidden" {...form.register("ogTitle")} />
          <input type="hidden" {...form.register("ogDescription")} />
          <input type="hidden" {...form.register("ogImage")} />
          <input type="hidden" {...form.register("twitterTitle")} />
          <input type="hidden" {...form.register("twitterDescription")} />
          <input type="hidden" {...form.register("twitterImage")} />
          <input type="hidden" {...form.register("structuredDataJson")} />

          {locked ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-800">
              <div className="flex items-center gap-2 text-amber-900">
                <Lock size={15} />
                {t("lockedTitle")}
              </div>
              <p className="mt-1">{page.indexPolicy.reason || t("lockedFallback")}</p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-600">
            {t("defaultsNotice")}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("fields.title")} error={form.formState.errors.title?.message}>
              <input {...form.register("title")} className="input h-11" />
            </Field>
            <Field label={t("fields.canonicalUrl")}>
              <input {...form.register("canonicalUrl")} className="input h-11" placeholder="https://www.cnsnap.com/path" />
            </Field>
          </div>

          <Field label={t("fields.description")} error={form.formState.errors.description?.message}>
            <textarea {...form.register("description")} className="input min-h-[110px] py-3" />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("fields.robots")}>
              <select {...form.register("robots")} className="input h-11" disabled={locked}>
                <option value="index,follow">index,follow</option>
                <option value="noindex,follow">noindex,follow</option>
                <option value="noindex,nofollow">noindex,nofollow</option>
              </select>
            </Field>
            <Field label={t("fields.enabled")}>
              <label className="flex h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700">
                <input type="checkbox" {...form.register("enabled")} />
                {t("enabledLabel")}
              </label>
            </Field>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <Button type="submit" className="rounded-full bg-[#ff1d5e] px-5 font-black text-white hover:bg-[#e21654]" disabled={isPending}>
              {isPending ? commonSave("saving") : t("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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
