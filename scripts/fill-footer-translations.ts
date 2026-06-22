import { prisma } from "../src/lib/db";
import { getEnabledFrontendLocaleConfigsRuntime } from "../src/lib/i18n/locale-config-store";
import { getFooterContentForLocale } from "../src/lib/frontend-content-blocks";

const footerKeys = [
  "footer_feature_cards_html",
  "footer_cta_html",
  "footer_columns_html",
  "footer_payment_html",
  "footer_bottom_html"
] as const;

async function main() {
  const [locales, blocks] = await Promise.all([
    getEnabledFrontendLocaleConfigsRuntime(),
    prisma.frontendContentBlock.findMany({
      where: { blockKey: { in: [...footerKeys] } }
    })
  ]);

  const blockMap = new Map(blocks.map((block) => [block.blockKey, block.id]));

  for (const locale of locales) {
    if (locale.locale === "en") continue;

    const localizedFooter = await getFooterContentForLocale(locale.locale);

    for (const key of footerKeys) {
      const blockId = blockMap.get(key);
      const content = localizedFooter[key]?.content?.trim() || "";
      if (!blockId || !content) continue;

      await prisma.frontendContentBlockDescription.upsert({
        where: {
          blockId_languageCode: {
            blockId,
            languageCode: locale.locale
          }
        },
        update: {
          content,
          translationStatus: "published"
        },
        create: {
          blockId,
          languageCode: locale.locale,
          content,
          translationStatus: "published"
        }
      });
    }

    console.log(`Filled footer translations for ${locale.locale}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
