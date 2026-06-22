import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink, Store } from "lucide-react";

import { WeidianStoreProductGrid } from "@/components/product/WeidianStoreProductGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { oneBoundClient } from "@/integrations/onebound/client";

type StorePageProps = {
  searchParams: Promise<{
    url?: string;
    page?: string;
  }>;
};

export default async function WeidianStorePage({ searchParams }: StorePageProps) {
  const params = await searchParams;
  const storeUrl = params.url ?? "";
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const result = storeUrl
    ? await oneBoundClient
        .getWeidianShopItems(storeUrl, page, 40)
        .then((data) => ({ data, error: null as string | null }))
        .catch((error: unknown) => ({
          data: null,
          error: error instanceof Error ? error.message : "Unable to load this Weidian shop."
        }))
    : { data: null, error: "Missing Weidian shop URL." };

  return (
    <main className="brand-page pb-12">
      <section className="frontend-page-shell">
        <div className="frontend-page-inner">
          <div className="label">Weidian shop</div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="frontend-title">Shop products</h1>
              <p className="frontend-lede">
                Browse products from this Weidian shop inside CNSnap. Product prices are shown in CNY before agent service fees.
              </p>
            </div>
            {result.data ? (
              <a
                href={`https://weidian.com/?userid=${result.data.shopId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[#d9e7ff] bg-white px-4 py-2 text-sm font-black text-[#344054] transition hover:border-[#e60012] hover:text-[#e60012]"
              >
                <ExternalLink size={16} />
                Original shop
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <div className="site-container py-8">
        {result.error || !result.data ? (
          <Card className="rounded-[28px] border-[#d9e7ff] bg-white">
            <CardContent className="p-10 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#fff1f2] text-[#e60012]">
                <Store size={22} />
              </div>
              <h2 className="mt-4 text-2xl font-black text-[#111827]">Unable to load shop</h2>
              <p className="mt-2 text-sm font-semibold text-[#667085]">{result.error}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[#d9e7ff] py-3 text-sm font-semibold text-[#667085]">
              <span>
                Shop ID <span className="font-black text-[#111827]">{result.data.shopId}</span>
              </span>
              <span>
                Page {result.data.page} · {result.data.products.length} products
              </span>
            </div>

            {result.data.products.length ? (
              <WeidianStoreProductGrid products={result.data.products} />
            ) : (
              <Card className="mt-6 rounded-[28px] border-[#d9e7ff] bg-white">
                <CardContent className="p-10 text-center">
                  <h2 className="text-2xl font-black text-[#111827]">No products found</h2>
                  <p className="mt-2 text-sm font-semibold text-[#667085]">This shop did not return products for the current page.</p>
                </CardContent>
              </Card>
            )}

            <div className="mt-8 flex items-center justify-center gap-3">
              <Button asChild variant="outline" className="rounded-full" disabled={page <= 1}>
                <Link href={buildStorePageHref(storeUrl, page - 1)} aria-disabled={page <= 1}>
                  <ChevronLeft size={16} />
                  Previous
                </Link>
              </Button>
              <span className="rounded-full border border-[#d9e7ff] bg-white px-4 py-2 text-sm font-black text-[#344054]">
                Page {page}
              </span>
              <Button asChild variant="outline" className="rounded-full" disabled={!result.data.hasNextPage}>
                <Link href={buildStorePageHref(storeUrl, page + 1)} aria-disabled={!result.data.hasNextPage}>
                  Next
                  <ChevronRight size={16} />
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function buildStorePageHref(storeUrl: string, page: number) {
  const params = new URLSearchParams({ url: storeUrl, page: String(Math.max(1, page)) });
  return `/item/store?${params.toString()}`;
}
