import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeoStructuredData } from "@/modules/seo/components/SeoStructuredData";
import { buildLandingPageHtml } from "@/modules/seo/lib/landing-page-content";
import type { SeoLandingPageRecord } from "@/modules/seo/types";

type SeoLandingPageViewProps = {
  page: SeoLandingPageRecord;
  structuredData: Record<string, unknown>[];
};

export async function SeoLandingPageView({ page, structuredData }: SeoLandingPageViewProps) {
  const pageHtml = buildLandingPageHtml(page);
  return (
    <main className="brand-page seo-landing-page pb-16 md:pb-20">
      <SeoStructuredData data={structuredData} />

      <section className="seo-landing-hero relative overflow-hidden border-b border-[#e8e3da] bg-[radial-gradient(circle_at_0%_0%,rgba(225,29,72,0.08),transparent_22rem),radial-gradient(circle_at_100%_12%,rgba(37,99,235,0.10),transparent_26rem),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(251,248,244,0.94))]">
        <div className="site-container py-12 md:py-20">
          <div className="max-w-[920px]">
            <div className="seo-landing-kicker text-[11px] font-black uppercase tracking-[0.18em] text-[#ff1d5e]">{page.type.replaceAll("_", " ")}</div>
            <h1 className="mt-4 max-w-5xl text-4xl font-black leading-tight text-[#101828] md:text-6xl">{page.heroTitle}</h1>
            {page.heroSubtitle ? <p className="seo-landing-subtitle mt-5 max-w-3xl text-base font-semibold leading-8 text-[#667085]">{page.heroSubtitle}</p> : null}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {page.ctaHref && page.ctaText ? (
              <Button asChild className="rounded-full bg-[#d9142f] px-5 font-black text-white hover:bg-[#b90f25]">
                <Link href={page.ctaHref}>
                  {page.ctaText}
                  <ArrowRight size={15} />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="site-container py-10 md:py-14">
        <div className="seo-landing-body mx-auto max-w-[900px]">
          <div className="content-page-panel seo-landing-content max-w-none text-sm font-semibold leading-8 text-[#667085]" dangerouslySetInnerHTML={{ __html: pageHtml }} />
        </div>
      </section>
    </main>
  );
}
