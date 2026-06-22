import type { MetadataRoute } from "next";
import type { SeoIndexPolicy, SeoRobotsRule, SeoRobotsValue } from "@/modules/seo/types";

export function robotsValueToMetadataRobots(value: SeoRobotsValue) {
  if (value === "index,follow") {
    return {
      index: true,
      follow: true
    };
  }
  if (value === "noindex,follow") {
    return {
      index: false,
      follow: true
    };
  }
  return {
    index: false,
    follow: false
  };
}

export function createRobotsMetadata(policy: SeoIndexPolicy) {
  return robotsValueToMetadataRobots(policy.robots);
}

export function createRobotsTxt(rules: SeoRobotsRule[], sitemapUrl?: string): MetadataRoute.Robots {
  const enabledRules = [...rules].filter((rule) => rule.enabled).sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    rules: [
      {
        userAgent: "*",
        allow: enabledRules.filter((rule) => rule.ruleType === "allow").map((rule) => rule.pathPattern),
        disallow: enabledRules.filter((rule) => rule.ruleType === "disallow").map((rule) => rule.pathPattern)
      }
    ],
    sitemap: sitemapUrl
  };
}
