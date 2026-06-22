"use client";

import { Heart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type StoredProductMemory = {
  id: string;
  title: string;
  image: string;
  priceCny: number;
  sourceUrl: string;
  href: string;
  platform: string;
  shopName?: string;
  savedAt: string;
};

const favoriteKey = "haitao_favorite_products";
const historyKey = "haitao_viewed_products";

export function ProductMemory({
  product,
  iconOnly = false
}: {
  product: Omit<StoredProductMemory, "savedAt">;
  iconOnly?: boolean;
}) {
  const [favorite, setFavorite] = useState(false);

  const record = useMemo<StoredProductMemory>(() => ({
    ...product,
    savedAt: new Date().toISOString()
  }), [product]);

  useEffect(() => {
    const favorites = readStoredProducts(favoriteKey);
    window.setTimeout(() => setFavorite(favorites.some((item) => item.id === product.id)), 0);
    writeStoredProducts(historyKey, [record, ...readStoredProducts(historyKey).filter((item) => item.id !== product.id)].slice(0, 24));
  }, [product.id, record]);

  function toggleFavorite() {
    const favorites = readStoredProducts(favoriteKey);
    const exists = favorites.some((item) => item.id === product.id);
    const next = exists ? favorites.filter((item) => item.id !== product.id) : [record, ...favorites].slice(0, 48);
    writeStoredProducts(favoriteKey, next);
    setFavorite(!exists);
  }

  const label = favorite ? "Saved" : "Save product";

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      aria-label={label}
      aria-pressed={favorite}
      title={label}
      className={`inline-flex items-center rounded-full border text-xs font-extrabold transition ${iconOnly ? "justify-center px-4 py-2" : "gap-2 px-4 py-2"} ${favorite ? "border-[#ffd7df] bg-[#fff3f5] text-[#d9142f]" : "border-[#dfe7f1] bg-white text-[#667085] hover:border-[#2563eb] hover:text-[#2563eb]"}`}
    >
      <Heart size={15} fill={favorite ? "currentColor" : "none"} />
      {iconOnly ? null : label}
    </button>
  );
}

export function readStoredProducts(key: string) {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]") as StoredProductMemory[];
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id && item?.title) : [];
  } catch {
    return [];
  }
}

function writeStoredProducts(key: string, items: StoredProductMemory[]) {
  window.localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("haitao-product-memory-updated"));
}
