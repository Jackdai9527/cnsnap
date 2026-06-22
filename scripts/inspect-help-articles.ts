import { prisma } from "../src/lib/db";

async function main() {
  const articles = await prisma.helpArticle.findMany({
    include: {
      descriptions: {
        orderBy: [{ languageCode: "asc" }]
      }
    },
    orderBy: [{ category: "asc" }, { updatedAt: "desc" }]
  });

  console.log(
    JSON.stringify(
      {
        count: articles.length,
        articles: articles.map((article) => ({
          id: article.id,
          slug: article.slug,
          title: article.title,
          locale: article.locale,
          isPublished: article.isPublished,
          descriptions: article.descriptions.map((description) => ({
            languageCode: description.languageCode,
            translationStatus: description.translationStatus,
            title: description.title,
            slug: description.slug,
            summaryLength: (description.summary || "").length,
            contentLength: (description.content || "").length
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
