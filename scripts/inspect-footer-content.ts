import { prisma } from "../src/lib/db";
import { getEnabledFrontendLocaleConfigsRuntime } from "../src/lib/i18n/locale-config-store";

async function main() {
  const [blocks, locales] = await Promise.all([
    prisma.frontendContentBlock.findMany({
      where: { blockKey: { startsWith: "footer_" } },
      include: { descriptions: { orderBy: [{ languageCode: "asc" }] } },
      orderBy: [{ sortOrder: "asc" }]
    }),
    getEnabledFrontendLocaleConfigsRuntime()
  ]);

  console.log(
    JSON.stringify(
      {
        locales: locales.map((locale) => ({ locale: locale.locale, name: locale.nativeName })),
        blocks: blocks.map((block) => ({
          blockKey: block.blockKey,
          descriptions: block.descriptions.map((description) => ({
            languageCode: description.languageCode,
            translationStatus: description.translationStatus,
            preview: (description.content || "").slice(0, 180)
          }))
        }))
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
