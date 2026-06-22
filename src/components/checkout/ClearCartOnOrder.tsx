"use client";

import { useEffect } from "react";
import { clearCart } from "@/lib/cart-store";

export function ClearCartOnOrder() {
  useEffect(() => {
    clearCart();
  }, []);

  return null;
}
