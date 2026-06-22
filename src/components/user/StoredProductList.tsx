"use client";

import Link from "next/link";
import { ExternalLink, Heart, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { money } from "@/lib/currency";
import type { StoredProductMemory } from "@/components/product/ProductMemory";
import { cn } from "@/lib/utils";

const keys = {
  favorites: "haitao_favorite_products",
  history: "haitao_viewed_products"
} as const;

export function StoredProductList({
  type,
  variant = "grid",
  query = ""
}: {
  type: keyof typeof keys;
  variant?: "grid" | "mobile-list";
  query?: string;
}) {
  const [items, setItems] = useState<StoredProductMemory[]>([]);

  useEffect(() => {
    const load = () => setItems(readItems(keys[type]));
    load();
    window.addEventListener("haitao-product-memory-updated", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("haitao-product-memory-updated", load);
      window.removeEventListener("storage", load);
    };
  }, [type]);

  function removeItem(id: string) {
    const next = items.filter((item) => item.id !== id);
    window.localStorage.setItem(keys[type], JSON.stringify(next));
    setItems(next);
  }

  function clearAll() {
    window.localStorage.removeItem(keys[type]);
    setItems([]);
  }

  if (!items.length) {
    return (
      <section className="panel p-8 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#fff3f5] text-[#d9142f]">
          <Heart size={21} />
        </div>
        <h2 className="mt-4 font-display text-3xl font-black text-[#101828]">{type === "favorites" ? "No saved products yet" : "No browsing history yet"}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-[#667085]">
          {type === "favorites" ? "Open a product and tap Save product to keep it here." : "Products you open from search or pasted links will appear here automatically."}
        </p>
        <Link href="/search" className="btn-primary mt-5">Find products</Link>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={clearAll} className="btn-secondary rounded-xl px-4 py-2">
          <Trash2 size={15} />
          Clear all
        </button>
      </div>
      <div className={cn(variant === "mobile-list" ? "stored-product-list-mobile md:grid md:grid-cols-3 xl:grid-cols-4" : "grid gap-2 md:grid-cols-3 xl:grid-cols-4")}>
        {items
          .filter((item) => {
            const keyword = query.trim().toLowerCase();
            if (!keyword) return true;
            return [item.title, item.shopName, item.platform]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(keyword);
          })
          .map((item) => (
          <article key={item.id} className={cn("panel stored-product-card overflow-hidden transition hover:-translate-y-0.5 hover:border-[#2563eb] hover:shadow-[0_18px_42px_rgba(37,99,235,0.12)]", variant === "mobile-list" && "stored-product-card-mobile-row")}>
            <Link href={item.href} className="block">
              <div className={cn("stored-product-card-media aspect-[1/0.7] bg-[#f8fafc]", variant === "mobile-list" && "stored-product-card-media-mobile-row")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
            </Link>
            <div className={cn("stored-product-card-body p-2", variant === "mobile-list" && "stored-product-card-body-mobile-row")}>
              <div className="flex items-center justify-between gap-2">
                <span className="stored-product-card-platform rounded-full bg-[#fff3f5] px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-[#d9142f]">{item.platform}</span>
                <button type="button" onClick={() => removeItem(item.id)} className="stored-product-card-remove rounded-full p-1 text-[#98a2b3] transition hover:bg-[#f8fafc] hover:text-[#d9142f]" aria-label="Remove product">
                  <Trash2 size={12} />
                </button>
              </div>
              <Link href={item.href} className="stored-product-card-title mt-1.5 line-clamp-2 font-extrabold leading-snug text-[#101828] hover:text-[#2563eb]">
                {item.title}
              </Link>
              <div className="stored-product-card-shop mt-1 text-[10px] font-semibold text-[#667085]">{item.shopName || "Source shop"}</div>
              <div className="stored-product-card-footer mt-1.5 flex items-end justify-between gap-2">
                <div>
                  <div className="stored-product-card-date text-[9px] font-bold text-[#98a2b3]">{new Date(item.savedAt).toLocaleDateString()}</div>
                  <div className="stored-product-card-price font-display text-[14px] font-black text-[#d9142f]">{money(item.priceCny, "CNY")}</div>
                </div>
                <Link href={item.sourceUrl} target="_blank" className="stored-product-card-link btn-secondary rounded-xl px-2 py-1" aria-label="Open source product">
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function readItems(key: string) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]") as StoredProductMemory[];
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id && item?.title) : [];
  } catch {
    return [];
  }
}
