import type { Metadata } from "next";
export { default } from "@/app/en/product/buy/page";
import { createMetadataFromIndexPolicy } from "@/modules/seo/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await createMetadataFromIndexPolicy("/product/buy", {
    title: "Temporary Product Purchase Page",
    description: "Temporary third-party product page resolved from a source marketplace URL."
  });
  return seo.metadata;
}
