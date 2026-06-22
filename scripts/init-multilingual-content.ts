import { prisma } from "@/lib/db";
import { ensureFooterContentBlocks } from "@/lib/frontend-content-blocks";
import { ensureHelpArticleDescriptions, ensurePageDescriptions } from "@/lib/content-localization";
import { ensureHelpFaqSeed } from "@/lib/help-center-service";
import { ensureSeoDatabaseSeeded } from "@/modules/seo/lib/db-sync";

async function main() {
  await ensureFooterContentBlocks();
  await ensureSeoDatabaseSeeded();
  await ensureHelpArticleDescriptions();
  await ensurePageDescriptions();
  await ensureHelpFaqSeed();

  const [
    footerBlocks,
    footerDescriptions,
    seoArticles,
    seoArticleDescriptions,
    seoLandingPages,
    seoLandingDescriptions,
    helpArticleDescriptions,
    pageDescriptions,
    faqItems,
    faqDescriptions
  ] = await Promise.all([
    prisma.frontendContentBlock.count(),
    prisma.frontendContentBlockDescription.count(),
    prisma.seoArticle.count(),
    prisma.seoArticleDescription.count(),
    prisma.seoLandingPage.count(),
    prisma.seoLandingPageDescription.count(),
    prisma.helpArticleDescription.count(),
    prisma.pageDescription.count(),
    prisma.faqItem.count(),
    prisma.faqItemDescription.count()
  ]);

  console.log("Initialized multilingual content:");
  console.log(`- Footer blocks: ${footerBlocks}`);
  console.log(`- Footer translations: ${footerDescriptions}`);
  console.log(`- SEO articles: ${seoArticles}`);
  console.log(`- SEO article translations: ${seoArticleDescriptions}`);
  console.log(`- SEO landing pages: ${seoLandingPages}`);
  console.log(`- SEO landing translations: ${seoLandingDescriptions}`);
  console.log(`- Help article translations: ${helpArticleDescriptions}`);
  console.log(`- Page translations: ${pageDescriptions}`);
  console.log(`- FAQ items: ${faqItems}`);
  console.log(`- FAQ translations: ${faqDescriptions}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
