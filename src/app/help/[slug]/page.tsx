import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getLocalizedHelpArticleBySlug } from "@/lib/content-localization";

type HelpArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function HelpArticlePage({ params }: HelpArticlePageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const article = await getLocalizedHelpArticleBySlug(slug, locale, true);
  if (!article) notFound();

  return (
    <main className="brand-page pb-12">
      <section className="frontend-page-shell">
        <div className="frontend-page-inner">
          <div className="label">{article.helpArticle.category}</div>
          <h1 className="frontend-title">{article.title}</h1>
        </div>
      </section>
      <article className="site-container py-8">
        <div className="content-page-panel panel prose max-w-none p-6 leading-8 text-[#667085]" dangerouslySetInnerHTML={{ __html: article.content }} />
      </article>
    </main>
  );
}
