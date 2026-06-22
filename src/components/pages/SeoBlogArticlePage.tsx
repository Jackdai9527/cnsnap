import Image from "next/image";
import { ArrowRight, Clock3, FolderOpen, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SeoLocaleLink } from "@/components/seo/SeoLocaleLink";
import { SeoStructuredData } from "@/modules/seo/components/SeoStructuredData";
import { createBlogArticleStructuredData } from "@/modules/seo/lib/blog-metadata";
import { getPublishedSeoArticles } from "@/modules/seo/lib/article-store";
import { parseFaqJson } from "@/modules/seo/lib/structured-data";
import type { SeoArticleRecord } from "@/modules/seo/types";

export async function SeoBlogArticleContent({
  article,
  canonicalPathname,
  rootPathname,
  blogPathname
}: {
  article: SeoArticleRecord;
  canonicalPathname: string;
  rootPathname: string;
  blogPathname: string;
}) {
  const [structuredData, allArticles] = await Promise.all([
    createBlogArticleStructuredData(article, { canonicalPathname, rootPathname, blogPathname }),
    getPublishedSeoArticles()
  ]);
  const tocItems = article.tableOfContents ? (JSON.parse(article.tableOfContents) as string[]) : [];
  const faqItems = parseFaqJson(article.faqJson);
  const relatedArticles = allArticles.filter((item) => (article.relatedArticleIds || []).includes(item.id));
  const relatedLinks = article.relatedLinksJson ? (JSON.parse(article.relatedLinksJson) as Array<{ label: string; href: string; description?: string }>) : [];

  return (
    <main className="brand-page seo-article-page pb-16 md:pb-20">
      <SeoStructuredData data={structuredData} />

      <section className="site-container py-8">
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#667085]">
          <SeoLocaleLink href="/" className="hover:text-[#d9142f]">Home</SeoLocaleLink>
          <span>/</span>
          <SeoLocaleLink href="/blog" className="hover:text-[#d9142f]">Blog</SeoLocaleLink>
          <span>/</span>
          <span className="text-[#101828]">{article.title}</span>
        </div>
      </section>

      <article className="site-container grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <Badge variant="outline" className="border-[#d9e7ff] bg-[#f7fbff] text-[#0a83ff]">
            {article.category?.name || "General"}
          </Badge>
          <h1 className="mt-4 text-4xl font-black leading-tight text-[#101828] md:text-5xl">{article.title}</h1>
          <p className="mt-4 text-lg font-semibold leading-8 text-[#667085]">{article.excerpt}</p>

          <div className="mt-6 flex flex-wrap gap-4 text-sm font-bold text-[#667085]">
            <span>By {article.authorName}</span>
            <span>Published {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("en-US") : "-"}</span>
            <span>Updated {new Date(article.updatedAt).toLocaleDateString("en-US")}</span>
            <span className="inline-flex items-center gap-2"><Clock3 size={15} /> {article.readingTime || 1} min read</span>
          </div>

          <div className="mt-6 overflow-hidden rounded-[28px] border border-[#e5e7eb] bg-white/88 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            <div className="relative aspect-[16/8] bg-[linear-gradient(135deg,#fff1f2,#f7fbff)]">
              <Image
                src={article.coverImage || "/brand/cnsnap-logo.svg"}
                alt={article.title}
                fill
                sizes="(max-width: 1024px) 100vw, 960px"
                className="object-contain p-10"
              />
            </div>
          </div>

          <div className="content-page-panel seo-article-content mt-10 max-w-none text-[#667085]" dangerouslySetInnerHTML={{ __html: article.content }} />

          {faqItems.length ? (
            <section className="mt-12 border-t border-[#e5e7eb] pt-10">
              <h2 className="text-2xl font-black text-[#101828]">FAQ</h2>
              <div className="mt-5 grid gap-4">
                {faqItems.map((item) => (
                  <div key={item.question} className="border-b border-[#edf1f5] pb-4 last:border-b-0">
                    <div className="text-lg font-black text-[#101828]">{item.question}</div>
                    <p className="mt-2 text-sm font-semibold leading-7 text-[#667085]">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {relatedArticles.length ? (
            <section className="mt-12 border-t border-[#e5e7eb] pt-10">
              <h2 className="text-2xl font-black text-[#101828]">Related Articles</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {relatedArticles.map((item) => (
                  <SeoLocaleLink key={item.id} href={`/blog/${item.localizedSlug || item.slug}`} className="rounded-[22px] border border-[#e5e7eb] bg-white/86 p-5 transition hover:border-[#0a83ff]">
                    <div className="text-sm font-black text-[#101828]">{item.title}</div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{item.excerpt}</p>
                  </SeoLocaleLink>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6">
          {tocItems.length ? (
            <Card className="rounded-[26px] border-[#e5e7eb] bg-white/86 shadow-[0_14px_34px_rgba(15,23,42,0.04)]">
              <CardContent className="p-5">
                <div className="text-lg font-black text-[#101828]">Table of Contents</div>
                <div className="mt-4 grid gap-2">
                  {tocItems.map((item, index) => (
                    <div key={item} className="flex items-start gap-3 border-b border-[#edf1f5] pb-2 last:border-b-0">
                      <span className="text-xs font-black text-[#98a2b3]">{String(index + 1).padStart(2, "0")}</span>
                      <div className="text-sm font-semibold text-[#667085]">{item}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="rounded-[28px] border-[#dfe7f1] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <CardContent className="p-5">
              <div className="text-lg font-black text-[#101828]">Article Tags</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <SeoLocaleLink key={tag.id} href={`/blog/tag/${tag.slug}`}>
                    <Badge variant="outline" className="border-[#d9e7ff] bg-[#f7fbff] text-[#0a83ff]">
                      <Tag size={12} className="mr-1" />
                      {tag.name}
                    </Badge>
                  </SeoLocaleLink>
                ))}
              </div>
            </CardContent>
          </Card>

          {relatedLinks.length ? (
            <Card className="rounded-[26px] border-[#e5e7eb] bg-white/86 shadow-[0_14px_34px_rgba(15,23,42,0.04)]">
              <CardContent className="p-5">
                <div className="text-lg font-black text-[#101828]">Related Service Links</div>
                <div className="mt-4 grid gap-3">
                  {relatedLinks.map((link) => (
                    <SeoLocaleLink key={`${link.href}-${link.label}`} href={link.href} className="rounded-2xl border border-[#edf1f5] bg-transparent px-4 py-3 transition hover:border-[#d9142f]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-black text-[#101828]">{link.label}</div>
                          {link.description ? <p className="mt-1 text-xs font-semibold leading-5 text-[#667085]">{link.description}</p> : null}
                        </div>
                        <ArrowRight size={16} className="text-[#d9142f]" />
                      </div>
                    </SeoLocaleLink>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="rounded-[26px] border-[#ead9de] bg-[linear-gradient(135deg,rgba(255,241,242,0.7),rgba(247,251,255,0.72))] shadow-[0_14px_34px_rgba(15,23,42,0.04)]">
            <CardContent className="p-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#ffd7df] bg-white px-3 py-1 text-xs font-black uppercase text-[#d9142f]">
                <FolderOpen size={12} />
                CTA Card
              </div>
              <div className="mt-4 text-xl font-black text-[#101828]">Continue with a service workflow</div>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">Move from guide content into the matching CNSnap action page.</p>
              <Button asChild className="mt-5 rounded-full bg-[#d9142f] px-5 font-black text-white hover:bg-[#b90f25]">
                <SeoLocaleLink href={ctaHref(article.ctaType)}>
                  Open next step
                  <ArrowRight size={15} />
                </SeoLocaleLink>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </article>
    </main>
  );
}

function ctaHref(ctaType: string) {
  switch (ctaType) {
    case "start_shopping":
      return "/";
    case "estimate_shipping":
      return "/estimation";
    case "submit_diy_order":
      return "/diy-order";
    case "use_forwarding":
      return "/forwarding";
    case "open_ticket":
      return "/account/help";
    case "register":
      return "/register";
    default:
      return "/blog";
  }
}
