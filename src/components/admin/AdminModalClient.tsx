"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

type AdminModalClientProps = {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  widthClass: string;
};

export function AdminModalClient({ id, title, description, children, widthClass }: AdminModalClientProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function syncFromHash() {
      setOpen(window.location.hash === `#${id}`);
    }

    function openFromTrigger(event: MouseEvent) {
      const target = event.target as Element | null;
      const trigger = target?.closest(`a[href="#${CSS.escape(id)}"]`);
      if (!trigger) return;
      event.preventDefault();
      history.pushState(null, "", `#${id}`);
      setOpen(true);
    }

    syncFromHash();
    document.addEventListener("click", openFromTrigger);
    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener("popstate", syncFromHash);
    return () => {
      document.removeEventListener("click", openFromTrigger);
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("popstate", syncFromHash);
    };
  }, [id]);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        setOpen(false);
      }
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function close() {
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <section id={id} className="admin-modal admin-modal-open" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
      <button type="button" className="admin-modal-backdrop" aria-label="Close modal" onClick={close} />
      <div className={`admin-modal-panel ${widthClass}`}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div>
            <h2 id={`${id}-title`} className="text-xl font-extrabold text-slate-950">{title}</h2>
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          </div>
          <button type="button" className="grid size-9 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:border-[#2563eb] hover:bg-[#eff6ff] hover:text-[#2563eb]" aria-label="Close modal" onClick={close}>
            <X size={18} />
          </button>
        </div>
        <div className="min-w-0 overflow-x-hidden p-5">{children}</div>
      </div>
    </section>
  );
}
