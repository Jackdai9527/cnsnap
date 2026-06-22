import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProductFetchError } from "@/components/product/ProductFetchError";
import { ProductPurchasePage } from "@/components/product/ProductPurchasePage";
import { oneBoundClient } from "@/integrations/onebound/client";
import { getCurrentUser, isUserActive } from "@/lib/session";
import { createMetadataFromIndexPolicy } from "@/modules/seo/lib/metadata";

type ProductPageProps = {
  params: Promise<{ platform: string; id: string }>;
  searchParams?: Promise<{ refresh?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const seo = await createMetadataFromIndexPolicy("/product/mock", {
    title: "Temporary Product Page",
    description: "Temporary third-party product detail page rendered for purchasing workflows."
  });
  return seo.metadata;
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const user = await getCurrentUser();
  if (user && !isUserActive(user.status)) {
    redirect("/login?callbackUrl=/search&error=account_blocked");
  }
  const { platform, id } = await params;
  const query = await searchParams;
  const result = await oneBoundClient
    .getItemDetail(platform, id, { refresh: query?.refresh === "1" })
    .then((product) => ({ product, errorMessage: undefined as string | undefined }))
    .catch((error: unknown) => ({
      product: null,
      errorMessage: error instanceof Error ? error.message : undefined
    }));

  if (!result.product) {
    return <ProductFetchError message={result.errorMessage} />;
  }

  return <ProductPurchasePage product={result.product} />;
}
