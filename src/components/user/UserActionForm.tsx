"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

type UserActionFormProps = {
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
  className?: string;
  submitLabel?: string;
};

export function UserActionForm({ action, children, className, submitLabel = "Submit" }: UserActionFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 2600);
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
        setError(caught instanceof Error ? caught.message : "Action failed. Please try again.");
      }
    });
  }

  return (
    <form action={submit} className={className}>
      {children}
      <div className="button-row mt-6 flex flex-wrap items-center gap-3">
        <button className="btn-primary rounded-xl px-6 py-3" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" size={16} /> : null}
          {isPending ? "Submitting..." : submitLabel}
        </button>
        {saved ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
            <CheckCircle2 size={16} />
            Submitted successfully
          </span>
        ) : null}
        {error ? <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-bold text-red-700">{error}</span> : null}
      </div>
    </form>
  );
}
