"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type WorkflowActionResult = {
  message?: string;
};

type WorkflowActionFormProps = {
  action: (formData: FormData) => Promise<WorkflowActionResult | void>;
  orderId: number;
  workflowAction: string;
  label: string;
  className: string;
  confirmationText?: string;
};

export function WorkflowActionForm({
  action,
  orderId,
  workflowAction,
  label,
  className,
  confirmationText
}: WorkflowActionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function submit(formData: FormData) {
    const message = confirmationText || `Confirm "${label}"?`;
    if (!window.confirm(message)) return;

    setError("");
    startTransition(async () => {
      try {
        const result = await action(formData);
        router.refresh();
        window.alert(result?.message || `${label} completed.`);
      } catch (caught) {
        const nextError = caught instanceof Error ? caught.message : "Action failed. Please try again.";
        setError(nextError);
        window.alert(nextError);
      }
    });
  }

  return (
    <form action={submit} className="contents">
      <input type="hidden" name="id" value={orderId} />
      <input type="hidden" name="workflowAction" value={workflowAction} />
      <button type="submit" className={className} disabled={isPending}>
        {isPending ? "Processing..." : label}
      </button>
      {error ? <span className="sr-only">{error}</span> : null}
    </form>
  );
}
