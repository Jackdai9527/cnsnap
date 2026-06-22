import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeCheck, Box, ChevronLeft, ChevronRight, Search, ShieldCheck, SlidersHorizontal, Truck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { MobileAppShell } from "@/components/mobile/layout/MobileAppShell";
import { ProductCard } from "@/components/product/ProductCard";
import { CnsnapSearchBox } from "@/components/product/CnsnapSearchBox";
import { SearchPanel } from "@/components/product/SearchPanel";
import { SearchRiskNoResults } from "@/components/product/RiskReminder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { platforms } from "@/lib/constants";
import { resolveFrontendLocale } from "@/lib/i18n/runtime";
import { getAppLocaleBySeoLocale, getSeoLocaleByAppLocale } from "../../../config/i18n";
import { detectSensitiveContent } from "@/lib/risk-control";
import { getCurrentUser, isUserActive } from "@/lib/session";
import { searchStorefrontProducts } from "@/lib/storefront-products";
import { buildBuyUrl, isSourceUrl } from "@/lib/source-url";
import { createMetadataFromIndexPolicy } from "@/modules/seo/lib/metadata";

export type SearchPageSearchParams = {
  q?: string;
  type?: string;
  platform?: string;
  page?: string;
  sort?: string;
  start_price?: string;
  end_price?: string;
  no_reason_return?: string;
  free_shipping?: string;
  tmall_flagship?: string;
};

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    platform?: string;
    page?: string;
    sort?: string;
    start_price?: string;
    end_price?: string;
    no_reason_return?: string;
    free_shipping?: string;
    tmall_flagship?: string;
  }>;
};

type SearchFilters = {
  sort: string;
  startPrice?: number;
  endPrice?: number;
};

const sortOptions = [
  { value: "default", label: "Best match" },
  { value: "sales", label: "Top sales" },
  { value: "price_asc", label: "Price low to high" },
  { value: "price_desc", label: "Price high to low" }
];

export async function generateMetadata(): Promise<Metadata> {
  const seo = await createMetadataFromIndexPolicy("/search", {
    title: "Product Search",
    description: "Search products from Taobao, 1688, Tmall, and more before creating a purchasing request."
  });
  return seo.metadata;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  return renderSearchPage({ searchParams });
}

export async function renderSearchPage({
  searchParams,
  localeOverride
}: SearchPageProps & {
  localeOverride?: string;
}) {
  const params = await searchParams;
  const resolvedLocale = localeOverride ? (getAppLocaleBySeoLocale(localeOverride) ?? localeOverride) : await resolveFrontendLocale();
  const frontendLocale = resolvedLocale;
  const publicLocale = localeOverride ?? getSeoLocaleByAppLocale(frontendLocale) ?? frontendLocale;
  const homeHref = `/${publicLocale}`;
  const helpHref = `/${publicLocale}/help`;
  const diyOrderHref = `/${publicLocale}/diy-order`;
  const searchHref = `/${publicLocale}/search`;
  const searchT = await getTranslations({ locale: frontendLocale, namespace: "search" });
  const user = await getCurrentUser();
  if (user && !isUserActive(user.status)) {
    redirect("/login?callbackUrl=/search&error=account_blocked");
  }
  const q = params.q?.trim() ?? "";
  const type = params.type ?? "keyword";
  const platform = params.platform ?? "all";
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const isUrl = isSourceUrl(q);
  const inputRisk = !isUrl && q ? await detectSensitiveContent(q) : { risky: false, matches: [] };
  const filters = readFilters(params);

  if (isUrl && type !== "shop") {
    redirect(buildBuyUrl(q, publicLocale));
  }

  if (q && inputRisk.risky) {
    return <SearchRiskPage q={q} type={type} platform={platform} filters={filters} params={params} translations={searchT} searchHref={searchHref} helpHref={helpHref} />;
  }

  let productSearch: Awaited<ReturnType<typeof searchStorefrontProducts>> | null = null;

  try {
    productSearch = await searchStorefrontProducts({
      q,
      platform,
      page,
      pageSize: 12,
      sort: filters.sort,
      startPrice: filters.startPrice,
      endPrice: filters.endPrice
    });
  } catch {
    return (
      <main className="brand-page pb-14">
        <MobileSearchErrorExperience
          q={q}
          type={type}
          platform={platform}
          filters={filters}
          translations={searchT}
          searchHref={searchHref}
          homeHref={homeHref}
        />
        <div className="hidden md:block">
          <SearchHero translations={searchT} />
        </div>
        <section className="site-container hidden py-7 md:block">
          <SearchErrorState q={q} translations={searchT} searchHref={searchHref} homeHref={homeHref} />
        </section>
      </main>
    );
  }

  const products = productSearch.items;
  const activeFilterCount = countActiveFilters(filters, platform);

  return (
    <main className="brand-page pb-14">
      <MobileSearchExperience
        q={q}
        type={type}
        platform={platform}
        page={page}
        filters={filters}
        products={products}
        hasNextPage={productSearch.hasNextPage}
        translations={searchT}
        searchHref={searchHref}
        homeHref={homeHref}
        diyOrderHref={diyOrderHref}
      />
      <div className="hidden md:block">
        <SearchHero translations={searchT} />
      </div>

      <section className="site-container hidden py-7 md:block">
        <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
          <SearchFilterPanel q={q} type={type} platform={platform} filters={filters} activeFilterCount={activeFilterCount} translations={searchT} searchHref={searchHref} />

          <div className="min-w-0">
            <SearchResultToolbar q={q} platform={platform} page={page} count={products.length} activeFilterCount={activeFilterCount} translations={searchT} />

            {products.length ? (
              <>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard key={`${product.platform}-${product.sourceItemId}`} product={product} />
                  ))}
                </div>
                <SearchPagination params={params} page={page} hasNextPage={productSearch.hasNextPage} translations={searchT} searchHref={searchHref} />
              </>
            ) : (
              <SearchEmptyState q={q} translations={searchT} homeHref={homeHref} diyOrderHref={diyOrderHref} />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function MobileSearchExperience({
  q,
  type,
  platform,
  page,
  filters,
  products,
  hasNextPage,
  translations,
  searchHref,
  homeHref,
  diyOrderHref
}: {
  q: string;
  type: string;
  platform: string;
  page: number;
  filters: SearchFilters;
  products: Awaited<ReturnType<typeof searchStorefrontProducts>>["items"];
  hasNextPage: boolean;
  translations: Awaited<ReturnType<typeof getTranslations>>;
  searchHref: string;
  homeHref: string;
  diyOrderHref: string;
}) {
  const activeFilterCount = countActiveFilters(filters, platform);

  return (
    <MobileAppShell className="mobile-search-page" showBottomSpacing>
      <section className="card-stack-section">
        <div className="mobile-search-sticky-panel is-compact">
          <div className="mobile-search-appbar">
            <Link href={homeHref} className="mobile-search-back-btn" aria-label={translations("error.goHome")}>
              <ArrowLeft size={16} />
            </Link>
            <div className="mobile-search-smartbox">
              <CnsnapSearchBox compact />
            </div>
          </div>
          <div className="mobile-search-floating-toolbar">
            <div className="mobile-search-toolbar">
              <span className="mobile-search-toolbar-chip is-count">
                {products.length ? translations("mobile.resultsReady", { count: products.length }) : translations("mobile.noResultsYet")}
              </span>
              <span className="mobile-search-toolbar-chip">{getSortOptionLabel(filters.sort, translations)}</span>
              <span className="mobile-search-toolbar-chip">{getPlatformLabel(platform, translations)}</span>
              <span className="mobile-search-toolbar-chip">{translations("toolbar.page", { page })}</span>
            </div>
            <MobileSearchFilterSheet
              q={q}
              type="keyword"
              platform={platform}
              filters={filters}
              activeFilterCount={activeFilterCount}
              translations={translations}
              searchHref={searchHref}
              compact
            />
          </div>
        </div>
      </section>

      <section className="card-stack-section">
        {products.length ? (
          <div className="mobile-search-results-grid">
            {products.map((product) => (
              <ProductCard key={`${product.platform}-${product.sourceItemId}-mobile`} product={product} />
            ))}
          </div>
        ) : (
          <MobileSearchEmptyState q={q} translations={translations} homeHref={homeHref} diyOrderHref={diyOrderHref} />
        )}
        {hasNextPage ? (
          <div className="mobile-search-loadmore-wrap">
            <Link
              href={buildSearchStateHref({
                searchHref,
                q,
                type,
                platform,
                page: page + 1,
                filters
              })}
              className="mobile-search-loadmore-btn"
            >
              {translations("mobile.loadMore")}
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : null}
      </section>
    </MobileAppShell>
  );
}

function MobileSearchFilterSheet({
  q,
  type,
  platform,
  filters,
  activeFilterCount,
  translations,
  searchHref,
  compact = false
}: {
  q: string;
  type: string;
  platform: string;
  filters: SearchFilters;
  activeFilterCount: number;
  translations: Awaited<ReturnType<typeof getTranslations>>;
  searchHref: string;
  compact?: boolean;
}) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <button type="button" className={compact ? "mobile-search-filter-trigger is-compact" : "mobile-search-filter-trigger"} />
        }
      >
        <SlidersHorizontal size={16} />
        <span>{translations("filters.title")}</span>
        {activeFilterCount ? (
          <span className="mobile-search-filter-count">
            {translations("filters.activeCount", { count: activeFilterCount })}
          </span>
        ) : null}
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[86dvh] overflow-y-auto rounded-t-[28px] border-t border-[#ebe7e0] bg-[#fbfaf8] p-0"
      >
        <SheetHeader className="border-b border-[#ebe7e0] px-4 pb-3 pt-4">
          <SheetTitle>{translations("filters.title")}</SheetTitle>
          <SheetDescription>{translations("filters.note")}</SheetDescription>
        </SheetHeader>
        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          <SearchFilterPanel
            q={q}
            type={type}
            platform={platform}
            filters={filters}
            activeFilterCount={activeFilterCount}
            translations={translations}
            searchHref={searchHref}
            mobile
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileSearchErrorExperience({
  q,
  type,
  platform,
  filters,
  translations,
  searchHref,
  homeHref
}: {
  q: string;
  type: string;
  platform: string;
  filters: SearchFilters;
  translations: Awaited<ReturnType<typeof getTranslations>>;
  searchHref: string;
  homeHref: string;
}) {
  return (
    <MobileAppShell className="mobile-search-page" showBottomSpacing>
      <section className="card-stack-section">
        <div className="mobile-home-section-heading">
          <div className="mobile-home-kicker">{translations("mobile.eyebrow")}</div>
          <h1 className="mobile-home-title">{translations("mobile.title")}</h1>
          <p className="mobile-home-copy">{translations("mobile.description")}</p>
        </div>
        <div className="mobile-search-sticky-panel">
          <SearchPanel compact mobile initialQuery={q} initialType={type} initialPlatform={platform} />
        </div>
        <div className="mobile-search-results-summary">
          <span className="mobile-search-result-pill">{getPlatformLabel(platform, translations)}</span>
          {countActiveFilters(filters, platform) ? (
            <span className="mobile-search-result-pill">{translations("toolbar.filters", { count: countActiveFilters(filters, platform) })}</span>
          ) : null}
        </div>
      </section>

        <section className="card-stack-section">
          <div className="mobile-search-state-card mobile-search-error-card">
            <div className="mobile-search-state-title">{translations("error.title")}</div>
            <p>{translations("error.description")}</p>
            <div className="mobile-search-state-actions">
            <Link
              href={buildSearchStateHref({
                searchHref,
                q,
                type,
                platform,
                page: 1,
                filters
              })}
              className="mobile-search-state-link is-primary"
            >
              {translations("error.retry")}
            </Link>
            <Link href={homeHref} className="mobile-search-state-link is-secondary">
              {translations("error.goHome")}
            </Link>
          </div>
          <div className="mobile-search-state-note">{translations("error.note")}</div>
        </div>
      </section>
    </MobileAppShell>
  );
}

function MobileSearchEmptyState({
  q,
  translations,
  homeHref,
  diyOrderHref
}: {
  q: string;
  translations: Awaited<ReturnType<typeof getTranslations>>;
  homeHref: string;
  diyOrderHref: string;
}) {
  return (
    <div className="mobile-search-state-card">
      <div className="mobile-search-state-title">{translations("empty.title")}</div>
      <p>{translations("empty.description")}</p>
      <div className="mobile-search-state-actions">
        <Link href={homeHref} className="mobile-search-state-link is-primary">
          {translations("empty.startFromHome")}
        </Link>
        <Link href={q ? `${diyOrderHref}?productName=${encodeURIComponent(q)}` : diyOrderHref} className="mobile-search-state-link is-secondary">
          {translations("empty.submitDiyOrder")}
        </Link>
      </div>
      <div className="mobile-search-state-note">{translations("mobile.emptyDescription")}</div>
    </div>
  );
}

function SearchHero({
  translations
}: {
  translations: Awaited<ReturnType<typeof getTranslations>>;
}) {
  const trustNotes = [
    { icon: ShieldCheck, title: translations("hero.trustNotes.reviewTitle"), text: translations("hero.trustNotes.reviewText") },
    { icon: BadgeCheck, title: translations("hero.trustNotes.photosTitle"), text: translations("hero.trustNotes.photosText") },
    { icon: Truck, title: translations("hero.trustNotes.shipTitle"), text: translations("hero.trustNotes.shipText") }
  ] as const;

  return (
    <section className="relative overflow-hidden border-b border-[#dfe7f1] bg-[radial-gradient(circle_at_8%_0%,rgba(217,20,47,0.08),transparent_24rem),radial-gradient(circle_at_94%_14%,rgba(10,131,255,0.16),transparent_28rem),linear-gradient(120deg,rgba(255,255,255,0.98),rgba(247,251,255,0.94))]">
      <div className="site-container relative py-8 md:py-11">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end">
          <div>
            <Badge variant="outline" className="border-[#ffd7df] bg-[#fff1f2] px-3 py-1 text-xs font-black uppercase text-[#d9142f]">
              {translations("hero.eyebrow")}
            </Badge>
            <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight text-[#101828] md:text-6xl">
              {translations("hero.title")}
            </h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-8 text-[#667085]">
              {translations("hero.description")}
            </p>
          </div>

          <div className="grid gap-3 rounded-[28px] border border-[#dfe7f1] bg-white/86 p-4 shadow-[0_20px_55px_rgba(15,23,42,0.07)]">
            {trustNotes.map((note) => {
              const Icon = note.icon;
              return (
                <div key={note.title} className="flex gap-3 rounded-2xl bg-[#f8fafc] p-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-[#0a83ff]">
                    <Icon size={18} />
                  </span>
                  <div>
                    <div className="text-sm font-black text-[#101828]">{note.title}</div>
                    <p className="mt-0.5 text-xs font-semibold leading-5 text-[#667085]">{note.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-7">
          <CnsnapSearchBox compact />
        </div>
      </div>
    </section>
  );
}

export async function getSearchPageMetadata(localeOverride?: string): Promise<Metadata> {
  const frontendLocale = localeOverride ? (getAppLocaleBySeoLocale(localeOverride) ?? localeOverride) : await resolveFrontendLocale();
  const searchT = await getTranslations({ locale: frontendLocale, namespace: "search" });
  const seo = await createMetadataFromIndexPolicy("/search", {
    title: searchT("mobile.title"),
    description: searchT("mobile.description"),
    ogTitle: searchT("mobile.title"),
    ogDescription: searchT("mobile.description"),
    twitterTitle: searchT("mobile.title"),
    twitterDescription: searchT("mobile.description")
  });
  return seo.metadata;
}

function SearchFilterPanel({
  q,
  type,
  platform,
  filters,
  activeFilterCount,
  translations,
  searchHref,
  mobile = false
}: {
  q: string;
  type: string;
  platform: string;
  filters: SearchFilters;
  activeFilterCount: number;
  translations: Awaited<ReturnType<typeof getTranslations>>;
  searchHref: string;
  mobile?: boolean;
}) {
  return (
    <aside className={mobile ? "mobile-search-filter-panel" : "h-fit rounded-[26px] border border-[#dfe7f1] bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)] xl:sticky xl:top-32"}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {!mobile ? (
            <div className="label flex items-center gap-2">
              <SlidersHorizontal size={14} />
              {translations("filters.eyebrow")}
            </div>
          ) : null}
          <h2 className={mobile ? "text-lg font-black text-[#101828]" : "mt-1 text-xl font-black text-[#101828]"}>{translations("filters.title")}</h2>
        </div>
        {activeFilterCount ? (
          <Badge variant="outline" className="border-[#d9e7ff] bg-[#f7fbff] text-[#0a83ff]">
            {translations("filters.activeCount", { count: activeFilterCount })}
          </Badge>
        ) : null}
      </div>

      <form className="mt-5 space-y-5">
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="q" value={q} />

        <div>
          <label className="mb-2 block text-sm font-black text-[#101828]" htmlFor="search-platform">{translations("filters.marketplace")}</label>
          <select id="search-platform" name="platform" defaultValue={platform} className="input h-12">
            <option value="all">{translations("filters.allPlatforms")}</option>
            {platforms.map((item) => (
              <option key={item} value={item}>
                {getPlatformLabel(item, translations)}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-black text-[#101828]">{translations("filters.sortBy")}</legend>
          <div className="grid gap-2">
            {sortOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#dfe7f1] bg-[#fbfdff] px-3 py-2.5 text-sm font-bold text-[#667085] transition hover:border-[#0a83ff] hover:bg-[#f7fbff] hover:text-[#0a83ff]"
              >
                <input type="radio" name="sort" value={option.value} defaultChecked={filters.sort === option.value} />
                {getSortOptionLabel(option.value, translations)}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="mb-2 block text-sm font-black text-[#101828]">{translations("filters.priceRange")}</label>
          <div className="grid grid-cols-2 gap-2">
            <input name="start_price" defaultValue={filters.startPrice ?? ""} inputMode="decimal" placeholder={translations("filters.priceMin")} className="input h-12" />
            <input name="end_price" defaultValue={filters.endPrice ?? ""} inputMode="decimal" placeholder={translations("filters.priceMax")} className="input h-12" />
          </div>
        </div>

        <div>
          <p className="rounded-2xl border border-[#dfe7f1] bg-[#fbfdff] px-4 py-3 text-sm font-semibold leading-6 text-[#667085]">
            {translations("filters.note")}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          <Button type="submit" className="h-11 rounded-full bg-[#d9142f] font-black text-white hover:bg-[#b90f25]">
            {translations("filters.apply")}
          </Button>
          <Button asChild type="button" variant="outline" className="h-11 rounded-full border-[#dfe7f1] bg-white font-black text-[#667085]">
            <Link href={q ? `${searchHref}?q=${encodeURIComponent(q)}` : searchHref}>{translations("filters.reset")}</Link>
          </Button>
        </div>
      </form>
    </aside>
  );
}

function SearchResultToolbar({
  q,
  platform,
  page,
  count,
  activeFilterCount,
  translations
}: {
  q: string;
  platform: string;
  page: number;
  count: number;
  activeFilterCount: number;
  translations: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <section className="rounded-[26px] border border-[#dfe7f1] bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-[#d9e7ff] bg-[#f7fbff] text-[#0a83ff]">
              {getPlatformLabel(platform, translations)}
            </Badge>
            <Badge variant="outline" className="border-[#ffd7df] bg-[#fff1f2] text-[#d9142f]">
              {translations("toolbar.page", { page })}
            </Badge>
            {activeFilterCount ? (
              <Badge variant="outline" className="border-[#bbf7d0] bg-[#ecfdf3] text-[#027a48]">
                {translations("toolbar.filters", { count: activeFilterCount })}
              </Badge>
            ) : null}
          </div>
          <h2 className="mt-3 text-2xl font-black text-[#101828]">
            {q ? translations("toolbar.resultsFor", { query: q }) : translations("toolbar.browseAll")}
          </h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#667085]">
            {translations("toolbar.description", { count })}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-[#f8fafc] px-3 py-2 text-sm font-bold text-[#667085]">
          <Search size={16} className="text-[#0a83ff]" />
          {translations("toolbar.catalog")}
        </div>
      </div>
    </section>
  );
}

function SearchPagination({
  params,
  page,
  hasNextPage,
  translations,
  searchHref
}: {
  params: Awaited<SearchPageProps["searchParams"]>;
  page: number;
  hasNextPage: boolean;
  translations: Awaited<ReturnType<typeof getTranslations>>;
  searchHref: string;
}) {
  return (
    <nav className="mt-7 flex flex-col gap-3 rounded-[24px] border border-[#dfe7f1] bg-white p-4 shadow-[0_16px_38px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-[#667085]">
        {translations("pagination.browsingPage", { page }).replace(String(page), "")}
        <span className="font-black text-[#101828]">{page}</span>
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Button asChild variant="outline" className="h-10 rounded-full border-[#dfe7f1] bg-white font-black text-[#667085]">
            <Link href={buildSearchHref(params, page - 1, searchHref)}>
              <ChevronLeft size={16} />
              {translations("pagination.previous")}
            </Link>
          </Button>
        ) : (
          <Button type="button" variant="outline" className="h-10 rounded-full border-[#dfe7f1] bg-white font-black text-[#98a2b3]" disabled>
            <ChevronLeft size={16} />
            {translations("pagination.previous")}
          </Button>
        )}
        {hasNextPage ? (
          <Button asChild className="h-10 rounded-full bg-[#101828] font-black text-white hover:bg-[#1f2937]">
            <Link href={buildSearchHref(params, page + 1, searchHref)}>
              {translations("pagination.next")}
              <ChevronRight size={16} />
            </Link>
          </Button>
        ) : (
          <Button type="button" className="h-10 rounded-full bg-[#101828] font-black text-white" disabled>
            {translations("pagination.next")}
            <ChevronRight size={16} />
          </Button>
        )}
      </div>
    </nav>
  );
}

function SearchEmptyState({
  q,
  translations,
  homeHref,
  diyOrderHref
}: {
  q: string;
  translations: Awaited<ReturnType<typeof getTranslations>>;
  homeHref: string;
  diyOrderHref: string;
}) {
  return (
    <section className="mt-5 rounded-[30px] border border-[#dfe7f1] bg-white p-8 text-center shadow-[0_20px_55px_rgba(15,23,42,0.06)]">
      <div className="mx-auto grid size-14 place-items-center rounded-3xl bg-[#f8fafc] text-[#98a2b3]">
        <Box size={25} />
      </div>
      <h2 className="mt-5 text-3xl font-black text-[#101828]">{translations("empty.title")}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-7 text-[#667085]">
        {translations("empty.description")}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild className="rounded-full bg-[#d9142f] font-black text-white hover:bg-[#b90f25]">
          <Link href={homeHref}>{translations("empty.startFromHome")}</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full border-[#dfe7f1] bg-white font-black text-[#101828]">
          <Link href={q ? `${diyOrderHref}?productName=${encodeURIComponent(q)}` : diyOrderHref}>{translations("empty.submitDiyOrder")}</Link>
        </Button>
      </div>
    </section>
  );
}

function SearchRiskPage({
  q,
  type,
  platform,
  filters,
  params,
  translations,
  searchHref,
  helpHref
}: {
  q: string;
  type: string;
  platform: string;
  filters: SearchFilters;
  params: Awaited<SearchPageProps["searchParams"]>;
  translations: Awaited<ReturnType<typeof getTranslations>>;
  searchHref: string;
  helpHref: string;
}) {
  return (
    <main className="brand-page pb-14">
      <MobileAppShell className="mobile-search-page md:hidden" showBottomSpacing>
        <section className="card-stack-section">
          <div className="mobile-home-section-heading">
            <div className="mobile-home-kicker">{translations("mobile.eyebrow")}</div>
            <h1 className="mobile-home-title">{translations("mobile.title")}</h1>
            <p className="mobile-home-copy">{translations("mobile.description")}</p>
          </div>
          <div className="mobile-search-sticky-panel">
            <SearchPanel compact mobile initialQuery={q} initialType={type} initialPlatform={platform} />
          </div>
          <div className="mobile-search-results-summary">
            <span className="mobile-search-result-pill">{getPlatformLabel(platform, translations)}</span>
            {countActiveFilters(filters, platform) ? (
              <span className="mobile-search-result-pill">{translations("toolbar.filters", { count: countActiveFilters(filters, platform) })}</span>
            ) : null}
          </div>
        </section>

        <section className="card-stack-section">
          <div className="mobile-search-state-card mobile-search-risk-card">
            <div className="mobile-search-state-title">{translations("risk.title")}</div>
            <p>{translations("risk.description")}</p>
            <div className="mobile-search-state-actions">
              <Link href={helpHref} className="mobile-search-state-link is-primary">
                {translations("risk.readRestrictions")}
              </Link>
              <Link href={buildSearchHref({ ...params, q: "" }, 1, searchHref)} className="mobile-search-state-link is-secondary">
                {translations("risk.tryAnotherSearch")}
              </Link>
            </div>
            <div className="mobile-search-state-note">{translations("risk.mobileNote")}</div>
          </div>
          <SearchRiskNoResults />
        </section>
      </MobileAppShell>

      <SearchHero translations={translations} />
      <section className="site-container py-7">
        <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
          <SearchFilterPanel q={q} type={type} platform={platform} filters={filters} activeFilterCount={countActiveFilters(filters, platform)} translations={translations} searchHref={searchHref} />
          <div className="min-w-0">
            <section className="rounded-[26px] border border-[#fedf89] bg-[#fffbeb] p-5 shadow-[0_16px_40px_rgba(180,83,9,0.08)]">
              <div className="flex gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-[#b54708]">
                  <ShieldCheck size={22} />
                </span>
                <div>
                  <h2 className="text-2xl font-black text-[#101828]">{translations("risk.title")}</h2>
                  <p className="mt-2 text-sm font-semibold leading-7 text-[#7a271a]">
                    {translations("risk.description")}
                  </p>
                </div>
              </div>
            </section>
            <SearchRiskNoResults />
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild className="rounded-full bg-[#d9142f] font-black text-white hover:bg-[#b90f25]">
                <Link href={helpHref}>{translations("risk.readRestrictions")}</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-[#dfe7f1] bg-white font-black text-[#101828]">
                <Link href={buildSearchHref({ ...params, q: "" }, 1, searchHref)}>
                  {translations("risk.tryAnotherSearch")}
                  <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function SearchErrorState({
  q,
  translations,
  searchHref,
  homeHref
}: {
  q: string;
  translations: Awaited<ReturnType<typeof getTranslations>>;
  searchHref: string;
  homeHref: string;
}) {
  return (
    <section className="rounded-[30px] border border-[#fecdd3] bg-[linear-gradient(180deg,#fff6f7_0%,#fffdfd_100%)] p-8 shadow-[0_20px_55px_rgba(217,20,47,0.08)]">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <div className="grid size-14 place-items-center rounded-3xl bg-white text-[#d9142f] shadow-[0_10px_24px_rgba(217,20,47,0.10)]">
          <ShieldCheck size={24} />
        </div>
        <h2 className="mt-5 text-3xl font-black text-[#101828]">{translations("error.title")}</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-[#667085]">
          {translations("error.description")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild className="rounded-full bg-[#d9142f] font-black text-white hover:bg-[#b90f25]">
            <Link href={buildSearchStateHref({ searchHref, q, page: 1 })}>{translations("error.retry")}</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-[#dfe7f1] bg-white font-black text-[#101828]">
            <Link href={homeHref}>{translations("error.goHome")}</Link>
          </Button>
        </div>
        <div className="mt-4 text-xs font-bold text-[#98a2b3]">{translations("error.note")}</div>
      </div>
    </section>
  );
}

function readFilters(params: Awaited<SearchPageProps["searchParams"]>): SearchFilters {
  return {
    sort: params.sort ?? "default",
    startPrice: params.start_price ? Number(params.start_price) : undefined,
    endPrice: params.end_price ? Number(params.end_price) : undefined
  };
}

function countActiveFilters(filters: SearchFilters, platform: string) {
  return [
    platform !== "all",
    filters.sort !== "default",
    filters.startPrice !== undefined,
    filters.endPrice !== undefined
  ].filter(Boolean).length;
}

function buildSearchHref(params: Awaited<SearchPageProps["searchParams"]>, page: number, searchHref = "/search") {
  const next = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) next.set(key, value);
  });
  next.set("page", String(page));
  return `${searchHref}?${next.toString()}`;
}

function buildSearchStateHref({
  searchHref = "/search",
  q,
  type,
  platform,
  page,
  filters
}: {
  searchHref?: string;
  q?: string;
  type?: string;
  platform?: string;
  page?: number;
  filters?: SearchFilters;
}) {
  const next = new URLSearchParams();

  if (q) next.set("q", q);
  if (type && type !== "keyword") next.set("type", type);
  if (platform && platform !== "all") next.set("platform", platform);
  if (filters?.sort && filters.sort !== "default") next.set("sort", filters.sort);
  if (filters?.startPrice !== undefined) next.set("start_price", String(filters.startPrice));
  if (filters?.endPrice !== undefined) next.set("end_price", String(filters.endPrice));
  if (page && page > 1) next.set("page", String(page));

  const query = next.toString();
  return query ? `${searchHref}?${query}` : searchHref;
}

function formatPlatform(platform: string) {
  if (platform === "all") return "All platforms";
  if (platform === "tmall") return "Tmall";
  if (platform === "jd") return "JD";
  if (platform === "vip") return "VIP";
  if (platform === "xianyu") return "Xianyu";
  if (platform === "1688") return "1688";
  return platform.charAt(0).toUpperCase() + platform.slice(1);
}

function getPlatformLabel(platform: string, translations: Awaited<ReturnType<typeof getTranslations>>) {
  const key = `platformLabels.${platform}` as const;
  return translations.has(key) ? translations(key) : formatPlatform(platform);
}

function getSortOptionLabel(value: string, translations: Awaited<ReturnType<typeof getTranslations>>) {
  const keyMap: Record<string, string> = {
    default: "sortOptions.default",
    sales: "sortOptions.sales",
    price_asc: "sortOptions.priceAsc",
    price_desc: "sortOptions.priceDesc"
  };
  const key = keyMap[value];
  return key && translations.has(key) ? translations(key) : value;
}
