"use client";

import { Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function AffiliateCopyButton({ value }: { value: string }) {
  const t = useTranslations("account.affiliate.copy");
  async function copy() {
    await navigator.clipboard.writeText(value);
    toast.success(t("copied"));
  }

  return (
    <Button type="button" variant="outline" onClick={copy}>
      <Copy />
      {t("label")}
    </Button>
  );
}
