"use client";

import { useFormStatus } from "react-dom";
import { XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { cancelAccountOrder } from "@/app/user/actions";
import { Button } from "@/components/ui/button";

export function CancelOrderButton({ orderId, compact = false }: { orderId: string; compact?: boolean }) {
  const t = useTranslations("account.orderDetail");

  return (
    <form action={cancelAccountOrder}>
      <input type="hidden" name="orderId" value={orderId} />
      <SubmitButton label={t("cancelOrder")} pendingLabel={t("cancellingOrder")} compact={compact} />
    </form>
  );
}

function SubmitButton({ label, pendingLabel, compact }: { label: string; pendingLabel: string; compact?: boolean }) {
  const { pending } = useFormStatus();

  if (compact) {
    return (
      <button type="submit" disabled={pending} className="mobile-orders-action" aria-disabled={pending}>
        {pending ? pendingLabel : label}
      </button>
    );
  }

  return (
    <Button type="submit" variant="outline" disabled={pending}>
      <XCircle />
      {pending ? pendingLabel : label}
    </Button>
  );
}
