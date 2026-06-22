import type { Metadata } from "next";
import BuyPage from "@/app/en/product/buy/page";
import { createMetadataFromIndexPolicy } from "@/modules/seo/lib/metadata";

type ProductBuyPageProps = {
  searchParams: Promise<{ url?: string; nTag?: string; from?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const seo = await createMetadataFromIndexPolicy("/product/buy", {
    title: "Temporary Product Purchase Page",
    description: "Temporary third-party product page resolved from a source marketplace URL."
  });
  return seo.metadata;
}

export default function ProductBuyPage({ searchParams }: ProductBuyPageProps) {
  return <BuyPage searchParams={searchParams} />;
}
