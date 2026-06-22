"use client";

import { useQuery } from "@tanstack/react-query";
import { helpArticles, helpCategories, helpFaqs } from "@/lib/account/help";

export function useHelpArticles() {
  return useQuery({
    queryKey: ["account", "help"],
    queryFn: async () => ({
      categories: helpCategories,
      articles: helpArticles,
      faqs: helpFaqs
    }),
    staleTime: 60_000
  });
}
