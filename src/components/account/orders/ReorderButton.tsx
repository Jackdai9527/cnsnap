"use client";

import { useState } from "react";
import { RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { addCartItem } from "@/lib/cart-store";
import { ensureAuthenticated } from "@/lib/auth-client";

type ReorderItem = {
  productId: number | null;
  platform: string;
  sourceItemId: string;
  title: string;
  image: string;
  priceCny: number;
  priceUsd: number;
  skuId?: string | null;
  skuText?: string | null;
  quantity: number;
};

export function ReorderButton({ items }: { items: ReorderItem[] }) {
  const t = useTranslations("account.dashboard.reorder");
  const [pending, setPending] = useState(false);

  async function handleReorder() {
    if (pending) return;
    if (!(await ensureAuthenticated())) return;

    setPending(true);
    try {
      for (const item of items) {
        addCartItem({
          productId: item.productId ?? 0,
          product: {
            platform: item.platform,
            sourceItemId: item.sourceItemId,
            title: item.title,
            mainImage: item.image,
            priceCny: item.priceCny,
            priceUsd: item.priceUsd
          },
          skuId: item.skuId ?? undefined,
          skuText: item.skuText ?? undefined,
          quantity: item.quantity
        });
      }
      window.location.href = "/cart";
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={handleReorder} disabled={pending || !items.length}>
      <RefreshCcw />
      {pending ? t("pending") : t("idle")}
    </Button>
  );
}
