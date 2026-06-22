import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Sparkles } from "lucide-react";
import { CnsnapPromoCarousel } from "@/components/home/CnsnapPromoCarousel";
import { CnsnapSearchBox } from "@/components/product/CnsnapSearchBox";
import { HomeProductGrid, type HomeProduct } from "@/components/product/HomeProductGrid";
import { SeoLocaleLink } from "@/components/seo/SeoLocaleLink";

type MobileHomePageProps = {
  heroEyebrow: string;
  heroTitlePrefix: string;
  heroTitleHighlight: string;
  heroDescription: string;
  whyTitle: string;
  whyDescription: string;
  solutionsTitle: string;
  solutionsDescription: string;
  solutions: Array<{
    title: string;
    description: string;
    cta: string;
    href: string;
    imageSrc: string;
    imageAlt: string;
  }>;
  processTitle: string;
  processSteps: Array<{
    title: string;
    description: string;
  }>;
  advantages: Array<{
    title: string;
    description: string;
    icon: typeof ShoppingBag;
  }>;
  homeProducts: HomeProduct[];
  storefrontPicksLabel: string;
  hotSellersLabel: string;
  viewMoreLabel: string;
  searchHref: string;
  buyLocale: string;
};

export function MobileHomePage({
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
}: MobileHomePageProps) {
  return (
    <div className="mobile-home-page md:hidden">
      <section className="cnsnap-home-hero mobile-home-section">
        <div className="cnsnap-home-hero-shell site-container relative pb-5 pt-3">
          <div className="cnsnap-home-hero-copy max-w-[960px]">
            <div className="cnsnap-home-hero-eyebrow inline-flex items-center gap-2 rounded-full border border-[#efe8df] bg-white/90 px-4 py-2 text-[12px] font-bold text-[#d9142f] shadow-[0_8px_20px_rgba(16,24,40,0.05)]">
              <Sparkles size={15} />
              {heroEyebrow}
            </div>
            <h1 className="cnsnap-home-hero-title mt-4 max-w-[900px]">
              {heroTitlePrefix} <span>{heroTitleHighlight}</span>
            </h1>
            <p className="cnsnap-home-hero-description mt-4 max-w-[700px] text-[15px] font-medium leading-7 text-[#616b7c]">
              {heroDescription}
            </p>
          </div>

          <div className="cnsnap-home-hero-search-wrap mt-5 max-w-[920px]">
            <div className="min-w-0">
              <div className="cnsnap-home-search-panel relative z-30">
                <CnsnapSearchBox hero heroPlaceholderVisible />
              </div>
            </div>
          </div>

          <div className="mt-5">
            <CnsnapPromoCarousel />
          </div>
        </div>
      </section>

      <section className="site-container pb-6">
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

      <section className="site-container py-6">
        <div className="cnsnap-process cnsnap-process-mobile">
          <div className="cnsnap-process-mobile-header">
            <div className="cnsnap-process-title">{processTitle}</div>
          </div>
          <div className="cnsnap-process-mobile-panel">
            <div className="cnsnap-process-graphic cnsnap-process-mobile-graphic">
              <Image
                src="/brand/cnsnap-home/cnsnap-process-flow.png"
                alt="CNSnap shopping process from order placement to global delivery"
                width={1960}
                height={980}
                className="cnsnap-process-image cnsnap-process-mobile-image"
              />
            </div>
            <div className="cnsnap-process-mobile-list">
              {processSteps.map((item, index) => (
                <article key={item.title} className="cnsnap-process-mobile-item">
                  <span className="cnsnap-process-step-index">{String(index + 1).padStart(2, "0")}</span>
                  <div className="cnsnap-process-mobile-copy">
                    <h2 className="cnsnap-process-item-title">{item.title}</h2>
                    <p className="cnsnap-process-item-text">{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="cnsnap-home-products-section site-container pb-6">
        <div className="cnsnap-home-products-header mb-5 flex items-end justify-between">
          <div>
            <div className="label">{storefrontPicksLabel}</div>
            <h2 className="cnsnap-home-products-title mt-2 text-[30px] font-bold tracking-tight text-[#16202f]">{hotSellersLabel}</h2>
          </div>
        </div>
        <HomeProductGrid products={homeProducts} buyLocale={buyLocale} />
        <div className="mt-4">
          <Link href={searchHref} className="cnsnap-home-mobile-more cnsnap-home-products-link">
            {viewMoreLabel} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="site-container pb-6">
        <section className="cnsnap-advantages">
          <div className="cnsnap-advantages-header">
            <div className="cnsnap-advantages-title">{whyTitle}</div>
            <p className="cnsnap-advantages-description">{whyDescription}</p>
          </div>
          {(() => {
            const heroItem = advantages[0];
            if (!heroItem) return null;
            const HeroIcon = heroItem.icon;

            return (
              <article className="cnsnap-advantage-hero-card">
                <span className="cnsnap-advantage-hero-icon">
                  <HeroIcon size={20} />
                </span>
                <div className="cnsnap-advantage-hero-copy">
                  <div className="cnsnap-advantage-hero-title">{heroItem.title}</div>
                  <div className="cnsnap-advantage-hero-text">{heroItem.description}</div>
                </div>
              </article>
            );
          })()}
          <div className="cnsnap-advantages-grid">
            {advantages.slice(1).map((item) => {
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
