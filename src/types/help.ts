export type HelpCategory = {
  id: string;
  slug?: string;
  title: string;
  description: string;
  icon: string;
  articleCount: number;
  href?: string;
};

export type HelpArticle = {
  id: string;
  title: string;
  slug: string;
  categoryId?: string;
  category: string;
  summary: string;
  content: string;
  keywords: string[];
  isPopular: boolean;
  updatedAt: string;
};

export type HelpFaq = {
  id: string;
  categoryId?: string;
  category: string;
  question: string;
  answer: string;
  relatedAction?: {
    label: string;
    href: string;
  };
};
