"use client";

import { ShoppingCart } from "lucide-react";
import { ensureAuthenticated } from "@/lib/auth-client";
import { addCartItem } from "@/lib/cart-store";

type Props = {
  productId: number;
  product: {
    platform: string;
    sourceItemId: string;
    title: string;
    mainImage: string;
    priceCny: number;
    priceUsd: number;
  };
  skuId?: string;
  skuText?: string;
};

export function AddToCartButton({ productId, product, skuId, skuText }: Props) {
  return (
    <button
      className="btn-primary w-full"
      type="button"
      onClick={async () => {
        if (!(await ensureAuthenticated())) return;
        addCartItem({ productId, product, skuId, skuText, quantity: 1 });
      }}
    >
      <ShoppingCart size={17} />
      Add to cart
    </button>
  );
}
