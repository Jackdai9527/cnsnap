"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type SeoRedirectEditorFormProps = {
  onSave: (formData: FormData) => Promise<void>;
};

export function SeoRedirectEditorForm({ onSave }: SeoRedirectEditorFormProps) {
  const t = useTranslations("seo.redirectEditor");
  const commonSave = useTranslations("common.saveForm");
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState({
    fromPath: "",
    toPath: "",
    statusCode: "301",
    enabled: true
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("fromPath", values.fromPath);
    formData.set("toPath", values.toPath);
    formData.set("statusCode", values.statusCode);
    formData.set("enabled", String(values.enabled));
    startTransition(async () => {
      try {
        await onSave(formData);
        toast.success(t("saved"));
        setValues({
          fromPath: "",
          toPath: "",
          statusCode: "301",
          enabled: true
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("saveFailed"));
      }
    });
  }

  return (
    <form className="grid gap-4 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4" onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label={t("fields.fromPath")}>
          <input value={values.fromPath} onChange={(event) => setValues((current) => ({ ...current, fromPath: event.target.value }))} className="input h-11" placeholder={t("placeholders.fromPath")} />
        </Field>
        <Field label={t("fields.toPath")}>
          <input value={values.toPath} onChange={(event) => setValues((current) => ({ ...current, toPath: event.target.value }))} className="input h-11" placeholder={t("placeholders.toPath")} />
        </Field>
        <Field label={t("fields.statusCode")}>
          <select value={values.statusCode} onChange={(event) => setValues((current) => ({ ...current, statusCode: event.target.value }))} className="input h-11">
            <option value="301">301</option>
            <option value="302">302</option>
          </select>
        </Field>
        <Field label={t("fields.enabled")}>
          <select value={values.enabled ? "true" : "false"} onChange={(event) => setValues((current) => ({ ...current, enabled: event.target.value === "true" }))} className="input h-11">
            <option value="true">{t("states.enabled")}</option>
            <option value="false">{t("states.disabled")}</option>
          </select>
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" className="rounded-full bg-[#ff1d5e] px-5 font-black text-white hover:bg-[#e21654]" disabled={isPending}>
          {isPending ? commonSave("saving") : t("add")}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-slate-900">{label}</span>
      {children}
    </label>
  );
}
