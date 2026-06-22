import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Sparkles } from "lucide-react";
import { CnsnapPromoCarousel } from "@/components/home/CnsnapPromoCarousel";
import { HomeProductGrid, type HomeProduct } from "@/components/product/HomeProductGrid";
import { CnsnapSearchBox } from "@/components/product/CnsnapSearchBox";
import { SeoLocaleLink } from "@/components/seo/SeoLocaleLink";

type SolutionItem = {
  title: string;
  description: string;
  cta: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
};

type ProcessStep = {
  title: string;
  description: string;
};

type AdvantageItem = {
  title: string;
  description: string;
  icon: typeof ShoppingBag;
};

type DesktopHomePageProps = {
  heroEyebrow: string;
  heroTitlePrefix: string;
  heroTitleHighlight: string;
  heroDescription: string;
  whyTitle: string;
  whyDescription: string;
  solutionsTitle: string;
  solutionsDescription: string;
  solutions: SolutionItem[];
  processTitle: string;
  processSteps: ProcessStep[];
  advantages: AdvantageItem[];
  homeProducts: HomeProduct[];
  storefrontPicksLabel: string;
  hotSellersLabel: string;
  viewMoreLabel: string;
  searchHref: string;
  buyLocale: string;
};

export function DesktopHomePage({
  heroEyebrow,
  heroTitlePrefix,
  heroTitleHighlight,
  heroDescription,
  whyTitle,
  whyDescription,
  solutionsTitle,
  solutionsDescription,
  solutions,
  processTitle,
  processSteps,
  advantages,
  homeProducts,
  storefrontPicksLabel,
  hotSellersLabel,
  viewMoreLabel,
  searchHref,
  buyLocale
}: DesktopHomePageProps) {
  return (
    <div className="hidden md:block">
      <section className="cnsnap-home-hero">
        <div className="site-container relative pb-7 pt-6 md:pb-8 md:pt-8">
          <div className="mx-auto max-w-[960px] text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#efe8df] bg-white/90 px-4 py-2 text-[12px] font-bold text-[#d9142f] shadow-[0_8px_20px_rgba(16,24,40,0.05)]">
              <Sparkles size={15} />
              {heroEyebrow}
            </div>
            <h1 className="cnsnap-home-hero-title mx-auto mt-4 max-w-[900px]">
              {heroTitlePrefix} <span>{heroTitleHighlight}</span>
            </h1>
            <p className="cnsnap-home-hero-description mx-auto mt-4 max-w-[700px] text-[15px] font-medium leading-7 text-[#616b7c] md:text-[16px]">
              {heroDescription}
            </p>
          </div>

          <div className="mx-auto mt-7 max-w-[920px]">
            <div className="min-w-0">
              <div className="cnsnap-home-search-panel relative z-30">
                <CnsnapSearchBox hero heroPlaceholderVisible />
              </div>
            </div>
          </div>

          <div className="mt-8">
            <CnsnapPromoCarousel />
          </div>
        </div>
      </section>

      <section className="site-container pb-8 md:pb-10">
        <section className="cnsnap-solutions">
          <div className="cnsnap-solutions-title">{solutionsTitle}</div>
          <p className="cnsnap-solutions-description">{solutionsDescription}</p>
          <div className="cnsnap-solutions-grid">
            {solutions.map((item) => (
              <article key={item.title} className="cnsnap-solution-card">
                <SeoLocaleLink href={item.href} className="cnsnap-solution-media" aria-label={item.title}>
                  <Image src={item.imageSrc} alt={item.imageAlt} width={720} height={720} className="cnsnap-solution-image" />
                </SeoLocaleLink>
                <div className="cnsnap-solution-content">
                  <h3 className="cnsnap-solution-heading">{item.title}</h3>
                  <p className="cnsnap-solution-text">{item.description}</p>
                  <SeoLocaleLink href={item.href} className="cnsnap-solution-cta">
                    {item.cta}
                  </SeoLocaleLink>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="site-container py-8 md:py-9">
        <div className="cnsnap-process">
          <div className="cnsnap-process-title">{processTitle}</div>
          <div className="cnsnap-process-graphic">
            <Image
              src="/brand/cnsnap-home/cnsnap-process-flow.png"
              alt="CNSnap shopping process from order placement to global delivery"
              width={1960}
              height={980}
              className="cnsnap-process-image"
            />
          </div>
          <div className="cnsnap-process-grid">
            {processSteps.map((item) => (
              <article key={item.title} className="cnsnap-process-item">
                <h2 className="cnsnap-process-item-title">{item.title}</h2>
                <p className="cnsnap-process-item-text">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="site-container pb-12">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <div className="label">{storefrontPicksLabel}</div>
            <h2 className="cnsnap-home-products-title mt-2 text-[30px] font-bold tracking-tight text-[#16202f]">{hotSellersLabel}</h2>
          </div>
          <Link href={searchHref} className="cnsnap-home-products-link hidden items-center gap-2 text-sm font-semibold text-[#d9142f] md:inline-flex">
            {viewMoreLabel} <ArrowRight size={16} />
          </Link>
        </div>
        <HomeProductGrid products={homeProducts} buyLocale={buyLocale} />
      </section>

      <section className="site-container pb-12">
        <section className="cnsnap-advantages">
          <div className="cnsnap-advantages-title">{whyTitle}</div>
          <p className="cnsnap-advantages-description">{whyDescription}</p>
          <div className="cnsnap-advantages-grid">
            {advantages.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="cnsnap-advantage-item">
                  <span className="cnsnap-advantage-icon">
                    <Icon size={18} />
                  </span>
                  <div className="cnsnap-advantage-copy">
                    <div className="cnsnap-advantage-heading">{item.title}</div>
                    <div className="cnsnap-advantage-text">{item.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </section>
    </div>
  );
}
