import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductFetchError } from "@/components/product/ProductFetchError";
import { ProductPurchasePage } from "@/components/product/ProductPurchasePage";
import { oneBoundClient } from "@/integrations/onebound/client";
import { getCurrentUser, isUserActive } from "@/lib/session";
import { detectPlatformFromUrl } from "@/lib/source-url";
import { createMetadataFromIndexPolicy } from "@/modules/seo/lib/metadata";

type BuyPageProps = {
  searchParams: Promise<{ url?: string; nTag?: string; from?: string }>;
  locale?: string;
};

export async function generateMetadata(): Promise<Metadata> {
  const seo = await createMetadataFromIndexPolicy("/product/buy", {
    title: "Temporary Product Purchase Page",
    description: "Temporary third-party product page resolved from a source marketplace URL."
  });
  return seo.metadata;
}

export default async function BuyPage({ searchParams, locale = "en" }: BuyPageProps) {
  const user = await getCurrentUser();
  if (user && !isUserActive(user.status)) {
    notFound();
  }
  const params = await searchParams;
  if (!params.url) {
    notFound();
  }

  const platform = detectPlatformFromUrl(params.url);
  const result = await oneBoundClient
    .searchByUrl(params.url)
    .then((product) => ({ product, errorMessage: undefined as string | undefined }))
    .catch((error: unknown) => ({
      product: null,
      errorMessage: error instanceof Error ? error.message : undefined
    }));

  if (!result.product) {
    return <ProductFetchError sourceUrl={params.url} message={result.errorMessage} locale={locale} />;
  }

  return <ProductPurchasePage product={{ ...result.product, platform }} sourceUrl={params.url} />;
}
