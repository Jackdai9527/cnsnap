import { prisma } from "@/lib/db";
import { ensureHelpArticleDescriptions } from "@/lib/content-localization";
import { helpFaqs, helpCategories, helpArticles } from "@/components/frontend/help/help-center-data";
import type { HelpArticle, HelpCategory, HelpFaq } from "@/types/help";
import { getNamespaceMessages } from "@/lib/i18n/messages";
import { getEnabledSeoLocalesRuntime } from "@/lib/i18n/locale-config-store";
import { getAppLocaleBySeoLocale, type AppLocale } from "../../config/i18n";
import { helpCategoryIds, type HelpCategoryId } from "@/components/frontend/help/help-center-data";

const DEFAULT_LOCALE = "en";

const helpArticleSlugAliases: Record<string, string> = {
  "how-to-buy": "how-to-place-an-order-using-a-product-link",
  "tutorial": "how-to-place-an-order-using-a-product-link",
  "shipping-guide": "how-is-international-shipping-fee-calculated",
  "restricted-items": "what-items-are-restricted",
  "top-up": "how-to-recharge-my-wallet"
};

function titleCaseFromKey(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

function slugifyCategoryId(value: string) {
  return value
    .replace(/([A-Z])/g, "-$1")
    .replace(/^-/, "")
    .toLowerCase();
}

function resolveEffectiveCategoryId(rowCategoryKey?: string | null, seedCategoryId?: HelpCategoryId) {
  if (rowCategoryKey && helpCategoryIds.includes(rowCategoryKey as HelpCategoryId)) {
    return rowCategoryKey as HelpCategoryId;
  }
  return seedCategoryId;
}

function getNestedMessage(record: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, record);
}

async function getHelpMessages(locale: string) {
  const messageLocale = (getAppLocaleBySeoLocale(locale) ?? locale) as AppLocale;
  const frontendMessages = await getNamespaceMessages("frontend", messageLocale) as Record<string, unknown>;
  const helpMessages = frontendMessages.HelpCenter;
  return (helpMessages && typeof helpMessages === "object" ? helpMessages : {}) as Record<string, unknown>;
}

function getMessageText(messages: Record<string, unknown>, path: string, fallback: string) {
  const value = getNestedMessage(messages, path);
  return typeof value === "string" ? value : fallback;
}

function hasLocalizedMessage(messages: Record<string, unknown>, path: string) {
  return typeof getNestedMessage(messages, path) === "string";
}

function buildLocalizedKeywords(seed: (typeof helpArticles)[number] | undefined, locale: string) {
  if (!seed) return [];
  const normalizedLocale = getAppLocaleBySeoLocale(locale) ?? locale;

  // Keep search keywords aligned with the visible page language on SEO pages.
  if (normalizedLocale === "zh-CN") {
    switch (seed.id) {
      case "place-order-link":
        return ["代购", "下单", "商品链接", "结账", "淘宝", "1688"];
      case "shopping-agent-service":
        return ["代购", "采购", "服务费", "仓库"];
      case "submit-diy-order":
        return ["DIY订单", "人工报价", "图片", "规格"];
      case "forwarding-service":
        return ["转运", "仓库地址", "用户代码", "物流单号"];
      case "shipping-fee-calculated":
        return ["运费", "估算", "体积重", "计费重"];
      case "separate-shipping":
        return ["分开支付运费", "仓库", "付款", "包裹"];
      case "restricted-items":
        return ["限制物品", "电池", "液体", "粉末", "食品", "奢侈品"];
      case "recharge-wallet":
        return ["钱包", "充值", "付款", "人工支付"];
      case "track-package":
        return ["包裹", "物流跟踪", "运输", "派送"];
      case "open-ticket":
        return ["工单", "客服", "回复", "客户服务"];
      default:
        return seed.keywords;
    }
  }

  return seed.keywords;
}

export async function ensureHelpFaqSeed() {
  const helpMessagesEn = await getHelpMessages(DEFAULT_LOCALE);
  const count = await prisma.faqItem.count();
  if (count > 0) {
    const descriptions = await prisma.faqItemDescription.findMany({
      where: { languageCode: DEFAULT_LOCALE }
    });
    for (const description of descriptions) {
      const nextQuestion = description.question.startsWith("faq.")
        ? String(getNestedMessage(helpMessagesEn as unknown as Record<string, unknown>, description.question) || description.question)
        : description.question;
      const nextAnswer = description.answer.startsWith("faq.")
        ? String(getNestedMessage(helpMessagesEn as unknown as Record<string, unknown>, description.answer) || description.answer)
        : description.answer;
      if (nextQuestion !== description.question || nextAnswer !== description.answer) {
        await prisma.faqItemDescription.update({
          where: { id: description.id },
          data: {
            question: nextQuestion,
            answer: nextAnswer
          }
        });
      }
    }
    return;
  }

  for (const [index, faq] of helpFaqs.entries()) {
    const item = await prisma.faqItem.create({
      data: {
        categoryKey: faq.categoryId,
        sortOrder: index + 1,
        status: "published"
      }
    });

    await prisma.faqItemDescription.create({
      data: {
        faqItemId: item.id,
        languageCode: DEFAULT_LOCALE,
        question: String(getNestedMessage(helpMessagesEn as unknown as Record<string, unknown>, faq.questionKey) || faq.questionKey),
        answer: String(getNestedMessage(helpMessagesEn as unknown as Record<string, unknown>, faq.answerKey) || faq.answerKey),
        translationStatus: "published"
      }
    });
  }
}

export async function ensureHelpCategoryKeys() {
  const categoryMap = new Map(helpArticles.map((item) => [item.slug, item.categoryId]));
  const articles = await prisma.helpArticle.findMany();
  for (const article of articles) {
    if (article.categoryKey) continue;
    await prisma.helpArticle.update({
      where: { id: article.id },
      data: {
        categoryKey: categoryMap.get(article.slug) || article.category.toLowerCase().replace(/[^a-z0-9]+/g, "")
      }
    });
  }
}

export async function getHelpCenterData(locale: string) {
  await ensureHelpArticleDescriptions();
  await ensureHelpFaqSeed();
  await ensureHelpCategoryKeys();
  const contentLocale = getAppLocaleBySeoLocale(locale) ?? locale;
  const helpMessages = await getHelpMessages(locale);

  const [articleRows, faqRows] = await Promise.all([
    prisma.helpArticle.findMany({
      where: { isPublished: true },
      include: {
        descriptions: {
          where: { languageCode: contentLocale },
          take: 1
        }
      },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }]
    }),
    prisma.faqItem.findMany({
      where: { status: "published" },
      include: {
        descriptions: {
          where: { languageCode: contentLocale },
          take: 1
        }
      },
      orderBy: [{ sortOrder: "asc" }]
    })
  ]);

  const fallbackArticles = await prisma.helpArticle.findMany({
    where: { id: { in: articleRows.filter((row) => row.descriptions.length === 0).map((row) => row.id) } },
    include: {
      descriptions: {
        where: { languageCode: DEFAULT_LOCALE },
        take: 1
      }
    }
  });
  const fallbackFaqs = await prisma.faqItem.findMany({
    where: { id: { in: faqRows.filter((row) => row.descriptions.length === 0).map((row) => row.id) } },
    include: {
      descriptions: {
        where: { languageCode: DEFAULT_LOCALE },
        take: 1
      }
    }
  });

  const articleFallbackMap = new Map(fallbackArticles.map((row) => [row.id, row.descriptions[0]]));
  const faqFallbackMap = new Map(fallbackFaqs.map((row) => [row.id, row.descriptions[0]]));
  const articleSeedMap = new Map(helpArticles.map((article) => [article.slug, article]));

  const normalizedArticleRows = articleRows.map((row) => {
    const seed = articleSeedMap.get(row.slug) || articleSeedMap.get(helpArticleSlugAliases[row.slug] || "");
    return {
      row,
      seed,
      effectiveCategoryId: resolveEffectiveCategoryId(row.categoryKey, seed?.categoryId)
    };
  });

  const categories: HelpCategory[] = helpCategories.map((category) => ({
    id: category.id,
    slug: slugifyCategoryId(category.id),
    title: getMessageText(helpMessages, category.titleKey, titleCaseFromKey(category.id)),
    description: getMessageText(helpMessages, category.descriptionKey, titleCaseFromKey(category.id)),
    icon: category.icon,
    articleCount: normalizedArticleRows.filter((item) => item.effectiveCategoryId === category.id).length
  }));
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  const articles: HelpArticle[] = normalizedArticleRows.map(({ row, seed, effectiveCategoryId }) => {
    const localizedCategory = effectiveCategoryId ? categoryMap.get(effectiveCategoryId) : undefined;
    const description = row.descriptions[0] || articleFallbackMap.get(row.id);
    const localizedTitle = seed ? getMessageText(helpMessages, seed.titleKey, row.title) : row.title;
    const localizedSummary = seed ? getMessageText(helpMessages, seed.summaryKey, row.excerpt) : row.excerpt;
    const localizedContent = seed ? getMessageText(helpMessages, seed.contentKey, row.content) : row.content;
    const shouldPreferLocalizedSeed = contentLocale !== DEFAULT_LOCALE
      && seed
      && (
        hasLocalizedMessage(helpMessages, seed.titleKey)
        || hasLocalizedMessage(helpMessages, seed.summaryKey)
        || hasLocalizedMessage(helpMessages, seed.contentKey)
      );

    return {
      id: String(row.id),
      title: shouldPreferLocalizedSeed ? localizedTitle : (description?.title || localizedTitle),
      slug: description?.slug || row.slug,
      categoryId: effectiveCategoryId ?? undefined,
      category: localizedCategory?.title || row.category,
      summary: shouldPreferLocalizedSeed ? localizedSummary : (description?.summary || localizedSummary),
      content: shouldPreferLocalizedSeed ? localizedContent : (description?.content || localizedContent),
      keywords: buildLocalizedKeywords(seed, locale),
      isPopular: Boolean(seed?.isPopular),
      updatedAt: row.updatedAt.toISOString().slice(0, 10)
    };
  });

  const faqs: HelpFaq[] = faqRows.map((row) => {
    const seed = helpFaqs[row.sortOrder - 1];
    const localizedCategory = categoryMap.get(row.categoryKey);
    const description = row.descriptions[0] || faqFallbackMap.get(row.id);
    const localizedQuestion = seed && seed.categoryId === row.categoryKey ? getMessageText(helpMessages, seed.questionKey, "") : "";
    const localizedAnswer = seed && seed.categoryId === row.categoryKey ? getMessageText(helpMessages, seed.answerKey, "") : "";
    const shouldPreferLocalizedSeed = contentLocale !== DEFAULT_LOCALE
      && seed?.categoryId === row.categoryKey
      && (
        hasLocalizedMessage(helpMessages, seed.questionKey)
        || hasLocalizedMessage(helpMessages, seed.answerKey)
      );

    return {
      id: String(row.id),
      categoryId: row.categoryKey,
      category: localizedCategory?.title || titleCaseFromKey(row.categoryKey),
      question: shouldPreferLocalizedSeed ? localizedQuestion : (description?.question || localizedQuestion),
      answer: shouldPreferLocalizedSeed ? localizedAnswer : (description?.answer || localizedAnswer)
    };
  });

  return { categories, articles, faqs };
}

export async function getHelpArticleForLocale(locale: string, slug: string) {
  const data = await getHelpCenterData(locale);
  const article = data.articles.find((item) => item.slug === slug);
  if (!article) return null;

  const relatedArticles = data.articles
    .filter((item) => item.id !== article.id && item.categoryId === article.categoryId)
    .slice(0, 4);
  const relatedFaqs = data.faqs
    .filter((item) => item.categoryId === article.categoryId)
    .slice(0, 6);

  return {
    article,
    relatedArticles,
    relatedFaqs
  };
}

export async function getHelpArticleAlternatesBySlug(slug: string) {
  const locales = await getEnabledSeoLocalesRuntime();
  const resolved = await Promise.all(
    locales.map(async (locale) => {
      const entry = await getHelpArticleForLocale(locale, slug);
      if (!entry) return null;
      return {
        locale,
        article: entry.article
      };
    })
  );

  return resolved.filter(Boolean) as Array<{
    locale: string;
    article: HelpArticle;
  }>;
}

export async function getHelpCategoryForLocale(locale: string, categorySlug: string) {
  const data = await getHelpCenterData(locale);
  const category = data.categories.find((item) => item.slug === categorySlug || item.id === categorySlug);
  if (!category) return null;

  const uniqueArticles = data.articles.filter((item, index, list) => {
    if (item.categoryId !== category.id) return false;
    return list.findIndex((candidate) => candidate.title === item.title) === index;
  });

  return {
    category,
    articles: uniqueArticles,
    faqs: data.faqs.filter((item) => item.categoryId === category.id)
  };
}

export async function getHelpCategoryAlternatesBySlug(slug: string) {
  const locales = await getEnabledSeoLocalesRuntime();
  const resolved = await Promise.all(
    locales.map(async (locale) => {
      const entry = await getHelpCategoryForLocale(locale, slug);
      if (!entry) return null;
      return {
        locale,
        category: entry.category
      };
    })
  );

  return resolved.filter(Boolean) as Array<{
    locale: string;
    category: HelpCategory;
  }>;
}
