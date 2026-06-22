"use client";

import { useCallback } from "react";

type WorkflowConfirmButtonProps = {
  label: string;
  className: string;
  confirmationText?: string;
};

export function WorkflowConfirmButton({ label, className, confirmationText }: WorkflowConfirmButtonProps) {
  const onClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const message = confirmationText || `Confirm "${label}"?`;
    if (!window.confirm(message)) {
      event.preventDefault();
    }
  }, [confirmationText, label]);

  return (
    <button type="submit" className={className} onClick={onClick}>
      {label}
    </button>
  );
}
