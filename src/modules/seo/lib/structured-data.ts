type SchemaNode = Record<string, unknown>;

export function createOrganizationSchema(input: { name: string; url: string; logo?: string }): SchemaNode {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input.name,
    url: input.url,
    logo: input.logo
  };
}

export function createWebsiteSchema(input: { name: string; url: string }): SchemaNode {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: input.name,
    url: input.url
  };
}

export function createWebPageSchema(input: { name: string; url: string; description?: string }): SchemaNode {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.name,
    url: input.url,
    description: input.description
  };
}

export function createBreadcrumbSchema(items: Array<{ name: string; url: string }>): SchemaNode {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function createFAQSchema(items: Array<{ question: string; answer: string }>): SchemaNode {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

export function createArticleSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Article"
  };
}

export function createProductSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Product"
  };
}

export function parseFaqJson(faqJson?: string | null) {
  if (!faqJson) return [];
  try {
    const parsed = JSON.parse(faqJson) as Array<{ question?: string; answer?: string }>;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item.question && item.answer).map((item) => ({
      question: item.question as string,
      answer: item.answer as string
    }));
  } catch {
    return [];
  }
}
