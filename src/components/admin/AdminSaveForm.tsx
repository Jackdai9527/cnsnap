"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Can } from "@/components/admin/Can";

type AdminSaveFormProps = {
  action: (formData: FormData) => Promise<void | { message?: string }>;
  children: React.ReactNode;
  className?: string;
  permission?: string;
  submitLabel?: string;
  confirmationText?: string;
  hideFooter?: boolean;
};

export function AdminSaveForm({ action, children, className, permission, submitLabel = "Save", confirmationText, hideFooter = false }: AdminSaveFormProps) {
  const t = useTranslations("common.saveForm");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [successMessage, setSuccessMessage] = useState(t("savedSuccessfully"));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 3200);
    return () => window.clearTimeout(timer);
  }, [saved]);

  function submit(formData: FormData) {
    if (confirmationText && !window.confirm(confirmationText)) return;
    setSaved(false);
    setSuccessMessage(t("savedSuccessfully"));
    setError("");
    startTransition(async () => {
      try {
        const result = await action(formData);
        if (result?.message) setSuccessMessage(result.message);
        setSaved(true);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : t("saveFailed"));
      }
    });
  }

  return (
    <form action={submit} className={className}>
      {children}
      {!hideFooter ? (
        permission ? (
          <Can permission={permission}>
            <SaveFormFooter isPending={isPending} saved={saved} successMessage={successMessage} error={error} submitLabel={submitLabel} />
          </Can>
        ) : (
          <SaveFormFooter isPending={isPending} saved={saved} successMessage={successMessage} error={error} submitLabel={submitLabel} />
        )
      ) : null}
    </form>
  );
}

function SaveFormFooter({ isPending, saved, successMessage, error, submitLabel }: { isPending: boolean; saved: boolean; successMessage: string; error: string; submitLabel: string }) {
  const t = useTranslations("common.saveForm");
  return (
    <div className="sticky bottom-0 z-10 -mx-5 -mb-5 mt-2 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
        <button className="admin-primary min-w-32 px-5 py-2.5 text-sm" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" size={16} /> : null}
          {isPending ? t("saving") : submitLabel}
        </button>
        {isPending ? <span className="text-sm font-semibold text-slate-500">{t("savingChanges")}</span> : null}
        {saved ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
            <CheckCircle2 size={16} />
            {successMessage}
          </span>
        ) : null}
        {error ? <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-bold text-red-700">{error}</span> : null}
    </div>
  );
}
