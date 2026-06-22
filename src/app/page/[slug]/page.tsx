import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getLocalizedPageBySlug } from "@/lib/content-localization";

type StaticPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function StaticPage({ params }: StaticPageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const page = await getLocalizedPageBySlug(slug, locale, true);
  if (!page || !page.page.isPublished) notFound();

  return (
    <article className="brand-page">
      <div className="site-container py-10">
        <div className="label">CNSnap page</div>
        <h1 className="mt-3 text-5xl font-black tracking-tight text-[#111827]">{page.title}</h1>
        <div className="site-card prose mt-6 max-w-none p-6 text-[#667085]" dangerouslySetInnerHTML={{ __html: page.contentHtml }} />
      </div>
    </article>
  );
}
