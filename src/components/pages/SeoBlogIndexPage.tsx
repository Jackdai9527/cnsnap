import { ArrowRight, BookOpenText, Compass, PackageOpen, SearchCheck, Truck, WandSparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SeoLocaleLink } from "@/components/seo/SeoLocaleLink";
import { SeoStructuredData } from "@/modules/seo/components/SeoStructuredData";
import { createBlogIndexStructuredData } from "@/modules/seo/lib/blog-metadata";
import { getPublishedSeoArticlesByLocale, getSeoArticleCategoriesByLocale } from "@/modules/seo/lib/article-store";
import type { SeoLocale } from "../../../config/i18n";

export async function SeoBlogIndexPage({ locale = "en" }: { locale?: SeoLocale }) {
  const t = await getTranslations("blog");
  const [articles, categories, structuredData] = await Promise.all([
    getPublishedSeoArticlesByLocale(locale),
    getSeoArticleCategoriesByLocale(locale),
    createBlogIndexStructuredData()
  ]);
  const featured = articles[0];
  const latestArticles = articles.slice(0, 6);
  const popularGuides = articles.slice(0, 4);
  const topicLabels = [
    t("topicCards.shoppingAgentGuides"),
    t("topicCards.shippingEstimation"),
    t("topicCards.forwardingGuides"),
    t("topicCards.diyOrderGuides"),
    t("topicCards.restrictedItems"),
    t("topicCards.platformGuides")
  ];

  return (
    <main className="brand-page pb-14">
      <SeoStructuredData data={structuredData} />

      <section className="relative overflow-hidden border-b border-[#dfe7f1] bg-[radial-gradient(circle_at_0%_0%,rgba(255,29,94,0.08),transparent_24rem),radial-gradient(circle_at_100%_10%,rgba(10,131,255,0.14),transparent_30rem),linear-gradient(120deg,rgba(255,255,255,0.98),rgba(247,251,255,0.95))]">
        <div className="site-container py-10 md:py-14">
          <Badge variant="outline" className="border-[#ffd7df] bg-[#fff1f2] px-3 py-1 text-xs font-black uppercase text-[#d9142f]">
            {t("hero.eyebrow")}
          </Badge>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight text-[#101828] md:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-8 text-[#667085]">
            {t("hero.description")}
          </p>
        </div>
      </section>

      <section className="site-container py-8">
        {featured ? (
          <Card className="overflow-hidden rounded-[30px] border-[#dfe7f1] bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
            <CardContent className="grid gap-6 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-8">
              <div>
                <div className="label">{t("featured.label")}</div>
                <h2 className="mt-2 text-3xl font-black text-[#101828]">{featured.title}</h2>
                <p className="mt-3 text-sm font-semibold leading-7 text-[#667085]">{featured.excerpt}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {featured.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag.id} variant="outline" className="border-[#d9e7ff] bg-[#f7fbff] text-[#0a83ff]">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
                <Button asChild className="mt-6 rounded-full bg-[#d9142f] px-5 font-black text-white hover:bg-[#b90f25]">
                  <SeoLocaleLink href={`/blog/${featured.localizedSlug || featured.slug}`}>
                    {t("featured.read")}
                    <ArrowRight size={16} />
                  </SeoLocaleLink>
                </Button>
              </div>
              <div className="rounded-[26px] border border-[#dfe7f1] bg-[#fbfdff] p-5">
                <div className="grid gap-3">
                  {topicLabels.map((topic, index) => (
                    <div key={topic} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                      <span className="grid size-9 place-items-center rounded-xl bg-[#101828] text-sm font-black text-white">{index + 1}</span>
                      <span className="text-sm font-black text-[#101828]">{topic}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </section>

      <section className="site-container py-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="label">{t("sections.categories")}</div>
            <h2 className="mt-2 text-3xl font-black text-[#101828]">{t("sections.browse")}</h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {categories.slice(0, 8).map((category) => (
            <SeoLocaleLink key={category.id} href={`/blog/category/${category.localizedSlug || category.slug}`} className="rounded-[24px] border border-[#dfe7f1] bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-[#0a83ff]">
              <div className="text-lg font-black text-[#101828]">{category.name}</div>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{category.description}</p>
            </SeoLocaleLink>
          ))}
        </div>
      </section>

      <section className="site-container py-6">
        <SectionHeader title={t("sections.latestTitle")} description={t("sections.latestDesc")} />
        <ArticleGrid articles={latestArticles} generalLabel={t("articleCard.general")} readLabel={t("articleCard.read")} />
      </section>

      <section className="site-container py-6">
        <SectionHeader title={t("sections.popularTitle")} description={t("sections.popularDesc")} />
        <ArticleGrid articles={popularGuides} generalLabel={t("articleCard.general")} readLabel={t("articleCard.read")} />
      </section>

      <section className="site-container py-6">
        <SectionHeader title={t("sections.topicsTitle")} description={t("sections.topicsDesc")} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            { title: t("topicCards.shoppingAgentGuides"), href: "/blog/category/shopping-agent-guides", icon: SearchCheck },
            { title: t("topicCards.shippingEstimation"), href: "/blog/category/shipping-estimation", icon: Compass },
            { title: t("topicCards.forwardingGuides"), href: "/blog/category/forwarding-guides", icon: Truck },
            { title: t("topicCards.diyOrderGuides"), href: "/blog/category/diy-order-guides", icon: WandSparkles },
            { title: t("topicCards.restrictedItems"), href: "/blog/category/restricted-items", icon: PackageOpen },
            { title: t("topicCards.platformGuides"), href: "/blog/category/platform-guides", icon: BookOpenText }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <SeoLocaleLink key={item.href} href={item.href} className="rounded-[26px] border border-[#dfe7f1] bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] transition hover:border-[#d9142f] hover:shadow-[0_18px_44px_rgba(217,20,47,0.08)]">
                <span className="grid size-11 place-items-center rounded-2xl bg-[#fff1f2] text-[#d9142f]">
                  <Icon size={18} />
                </span>
                <h3 className="mt-4 text-xl font-black text-[#101828]">{item.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{t("topicCards.description")}</p>
              </SeoLocaleLink>
            );
          })}
        </div>
      </section>

      <section className="site-container py-10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CtaCard title={t("cta.startShopping.title")} href="/" description={t("cta.startShopping.description")} />
          <CtaCard title={t("cta.estimateShipping.title")} href="/estimation" description={t("cta.estimateShipping.description")} />
          <CtaCard title={t("cta.submitDiyOrder.title")} href="/diy-order" description={t("cta.submitDiyOrder.description")} />
          <CtaCard title={t("cta.useForwarding.title")} href="/forwarding" description={t("cta.useForwarding.description")} />
        </div>
      </section>
    </main>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-3xl font-black text-[#101828]">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{description}</p>
    </div>
  );
}

function ArticleGrid({
  articles,
  generalLabel,
  readLabel
}: {
  articles: Awaited<ReturnType<typeof getPublishedSeoArticlesByLocale>>;
  generalLabel: string;
  readLabel: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {articles.map((article) => (
        <SeoLocaleLink key={article.id} href={`/blog/${article.localizedSlug || article.slug}`} className="rounded-[26px] border border-[#dfe7f1] bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-[#0a83ff]">
          <div className="text-xs font-black uppercase tracking-[0.12em] text-[#d9142f]">{article.category?.name || generalLabel}</div>
          <h3 className="mt-3 text-xl font-black text-[#101828]">{article.title}</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{article.excerpt}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {article.tags.slice(0, 3).map((tag) => (
              <Badge key={tag.id} variant="outline" className="border-[#e5ecf6] bg-[#fbfdff] text-[#667085]">
                {tag.name}
              </Badge>
            ))}
          </div>
          <div className="mt-5 text-sm font-black text-[#0a83ff]">{readLabel}</div>
        </SeoLocaleLink>
      ))}
    </div>
  );
}

function CtaCard({ title, href, description }: { title: string; href: string; description: string }) {
  return (
    <SeoLocaleLink href={href} className="rounded-[26px] border border-[#dfe7f1] bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] transition hover:border-[#d9142f]">
      <h3 className="text-xl font-black text-[#101828]">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{description}</p>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#d9142f]">
        Open
        <ArrowRight size={15} />
      </div>
    </SeoLocaleLink>
  );
}
