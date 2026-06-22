import type { MetadataRoute } from "next";
import { createSitemap } from "@/modules/seo/lib/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return createSitemap();
}
