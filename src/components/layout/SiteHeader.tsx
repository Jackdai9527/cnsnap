"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CnsnapSearchBox } from "@/components/product/CnsnapSearchBox";
import { HeaderSearchVisibility } from "@/components/layout/HeaderSearchVisibility";
import { MainNav } from "@/components/layout/MainNav";
import { MobileHeader } from "@/components/layout/mobile/MobileHeader";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { HeaderCartDropdown } from "@/components/layout/HeaderCartDropdown";
import type { FrontendLanguageOption } from "@/lib/i18n/frontend";
import { resolveFrontendHrefForLocale } from "@/modules/seo/lib/route-resolver";
import { shouldShowMobileSearchHeader } from "@/lib/mobile-header-rules";
import { cn } from "@/lib/utils";

type HeaderAuthState = {
  authenticated: boolean;
  email?: string | null;
};

export function SiteHeader({
  currencies = ["USD", "CNY"],
  defaultCurrency = "USD",
  pageLanguage = "en",
  publicLocale,
  translateLanguages = [],
  auth = { authenticated: false }
}: {
  currencies?: string[];
  defaultCurrency?: string;
  pageLanguage?: FrontendLanguageOption["code"];
  publicLocale?: string;
  translateLanguages?: FrontendLanguageOption[];
  auth?: HeaderAuthState;
}) {
  const pathname = usePathname();
  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/admin") ||
    pathname === "/checkout" ||
    pathname.startsWith("/checkout") ||
    pathname.endsWith("/checkout")
  ) {
    return null;
  }

  const homeHref = resolveFrontendHrefForLocale({
    pathname: "/",
    locale: pageLanguage
  });
  const showMobileSearchHeader = shouldShowMobileSearchHeader(pathname);

  return (
    <header className={cn("cnsnap-header z-40", !showMobileSearchHeader && "mobile-header-shell-hidden")}>
      <div className="cnsnap-header-main site-container">
        <Link href={homeHref} className="hidden shrink-0 items-center md:flex" aria-label="CNSnap home">
          <Image
            src="/brand/cnsnap-logo.svg"
            alt="CNSnap"
            width={1540}
            height={453}
            priority
            className="h-[42px] w-auto"
          />
        </Link>
        <HeaderSearchVisibility className="hidden min-w-0 flex-1 px-3 lg:block">
          <CnsnapSearchBox compact />
        </HeaderSearchVisibility>
        <MobileHeader homeHref={homeHref} />
        <div className="cnsnap-header-actions hidden shrink-0 items-center gap-2 md:flex">
          <ThemeToggle />
          <span className="hidden min-[440px]:inline-flex">
            <HeaderCartDropdown />
          </span>
        </div>
      </div>
      <div className="cnsnap-header-nav">
        <div className="site-container flex min-h-[48px] items-center">
          <MainNav
            currencies={currencies}
            defaultCurrency={defaultCurrency}
            pageLanguage={pageLanguage}
            publicLocale={publicLocale}
            translateLanguages={translateLanguages}
            auth={auth}
          />
        </div>
      </div>
    </header>
  );
}
