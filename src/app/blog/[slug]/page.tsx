import { redirect } from "next/navigation";

type LegacyBlogArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LegacyBlogArticlePage({ params }: LegacyBlogArticlePageProps) {
  const { slug } = await params;
  redirect(`/en/blog/${slug}`);
}
