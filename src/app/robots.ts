import type { MetadataRoute } from "next";
import { createRobotsTxt } from "@/modules/seo/lib/robots";
import { seoRobotsRulesMock, seoSettingsMock } from "@/modules/seo/mock/data";

export default function robots(): MetadataRoute.Robots {
  return createRobotsTxt(seoRobotsRulesMock, `${seoSettingsMock.canonicalBaseUrl.replace(/\/+$/, "")}/sitemap.xml`);
}
