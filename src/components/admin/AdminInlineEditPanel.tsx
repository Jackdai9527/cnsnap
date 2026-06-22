"use client";

import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

type AdminInlineEditPanelProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  editContent: React.ReactNode;
};

export function AdminInlineEditPanel({ title, subtitle, children, editContent }: AdminInlineEditPanelProps) {
  const t = useTranslations("common.inlineEdit");
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <div className="admin-card group relative min-w-0 p-3.5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-900">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs font-semibold text-slate-400">{subtitle}</p> : null}
        </div>
        <button type="button" className="admin-action px-2 py-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100" onClick={() => setOpen(true)}>
          {t("edit")}
        </button>
      </div>
      {children}

      {open ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/20 px-4 py-8 backdrop-blur-[1px]" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <button type="button" className="absolute inset-0 cursor-default" aria-label={t("closeEditor")} onClick={() => setOpen(false)} />
          <div className="relative z-10 max-h-[calc(100dvh-4rem)] w-[min(80vw,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_22px_70px_rgba(15,23,42,0.22)]">
            <div className="mb-3 flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 id={titleId} className="font-black text-slate-900">{title}</h4>
                {subtitle ? <p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p> : null}
              </div>
              <button type="button" className="grid size-8 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:border-[#2563eb] hover:bg-[#eff6ff] hover:text-[#2563eb]" aria-label={t("closeEditor")} onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </div>
            {editContent}
          </div>
        </div>
      ) : null}
    </div>
  );
}
