"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

type AdminSettingRowFormProps = {
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
  formId: string;
  settingKey: string;
  layout?: "table" | "inline";
  valueCellClassName?: string;
  actionCellClassName?: string;
  submitLabel?: string;
  successLabel?: string;
};

export function AdminSettingRowForm({
  action,
  children,
  formId,
  settingKey,
  layout = "table",
  valueCellClassName,
  actionCellClassName,
  submitLabel = "Save",
  successLabel = "Saved"
}: AdminSettingRowFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 3200);
    return () => window.clearTimeout(timer);
  }, [saved]);

  function submit(formData: FormData) {
    setSaved(false);
    setError("");
    startTransition(async () => {
      try {
        await action(formData);
        setSaved(true);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Save failed.");
      }
    });
  }

  const valueControl = (
    <form id={formId} action={submit} className="contents">
      <input type="hidden" name="key" value={settingKey} />
      {children}
    </form>
  );
  const actionControl = (
    <div className="flex min-w-[128px] flex-wrap items-center gap-2">
      <button form={formId} className="admin-primary min-w-16 gap-1.5" disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" size={14} /> : null}
        {isPending ? "Saving..." : submitLabel}
      </button>
      {saved ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
          <CheckCircle2 size={13} />
          {successLabel}
        </span>
      ) : null}
      {error ? <span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-700">{error}</span> : null}
    </div>
  );

  if (layout === "inline") {
    return (
      <>
        <div className={valueCellClassName}>{valueControl}</div>
        <div className={actionCellClassName}>{actionControl}</div>
      </>
    );
  }

  return (
    <>
      <td className={valueCellClassName}>{valueControl}</td>
      <td className={actionCellClassName}>{actionControl}</td>
    </>
  );
}
