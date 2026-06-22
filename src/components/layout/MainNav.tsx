"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  PackageCheck,
  ReceiptText,
  Ticket,
  UserRound,
  WalletCards
} from "lucide-react";
import { useMemo } from "react";

import { FrontendLanguageSwitcher } from "@/components/layout/FrontendLanguageSwitcher";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildLocalizedUiHref } from "@/lib/i18n/frontend-routing";
import type { FrontendLanguageOption } from "@/lib/i18n/frontend";
import { resolveFrontendHrefForLocale } from "@/modules/seo/lib/route-resolver";

const navItems = [
  { key: "shoppingAgent", href: "/" },
  { key: "estimation", href: "/estimation" },
  { key: "promotion", href: "/promotion" },
  { key: "diyOrder", href: "/diy-order" },
  { key: "forwarding", href: "/forwarding" },
  { key: "helpCenter", href: "/help" }
] as const;

const accountItems = [
  { key: "dashboard", href: "/account", icon: LayoutDashboard },
  { key: "orders", href: "/account/orders", icon: ReceiptText },
  { key: "packages", href: "/account/packages", icon: PackageCheck },
  { key: "wallet", href: "/account/wallet", icon: WalletCards },
  { key: "ticketsCenter", href: "/account/tickets", icon: Ticket }
] as const;

type AuthState = {
  authenticated: boolean;
  email?: string | null;
};

export function MainNav({
  currencies,
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
  auth?: AuthState;
}) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const navLocale = pageLanguage;
  const navLinks = useMemo(
    () => navItems.map((item) => ({
      ...item,
      label: t(item.key),
      localizedHref: resolveFrontendHrefForLocale({
        pathname: item.href,
        locale: navLocale as FrontendLanguageOption["code"]
      })
    })),
    [navLocale, t]
  );

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).catch(() => null);
    window.location.href = resolveFrontendHrefForLocale({
      pathname: "/",
      locale: navLocale as FrontendLanguageOption["code"]
    });
  }

  return (
    <div className="flex min-h-[48px] w-full items-center justify-between gap-3">
      <nav className="hidden items-center gap-1 overflow-x-auto text-[13px] font-bold text-[#3f4754] lg:flex" aria-label="Main navigation">
        {navLinks.map((item) => (
          <MainNavLink key={item.href} href={item.localizedHref} active={isActivePath(pathname, item.localizedHref)}>
            {item.label}
          </MainNavLink>
        ))}
      </nav>

      <div className="ml-auto hidden shrink-0 items-center gap-2 lg:flex">
        <FrontendLanguageSwitcher
          currencies={currencies ?? ["USD", "CNY"]}
          defaultCurrency={defaultCurrency}
          pageLanguage={pageLanguage}
          publicLocale={publicLocale}
          languages={translateLanguages}
        />
        <AuthActions auth={auth} onLogout={logout} locale={navLocale as FrontendLanguageOption["code"]} />
      </div>
    </div>
  );
}

function MainNavLink({
  href,
  active,
  children,
  className
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "cnsnap-nav-pill",
        active ? "is-active" : "text-[#4b5565]",
        className
      )}
    >
      {children}
    </Link>
  );
}

function AuthActions({
  auth,
  onLogout,
  locale
}: {
  auth: AuthState;
  onLogout: () => void;
  locale: FrontendLanguageOption["code"];
}) {
  const t = useTranslations("nav");
  const loginHref = buildLocalizedUiHref("/login", locale as never);
  const registerHref = buildLocalizedUiHref("/register", locale as never);

  if (!auth.authenticated) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" className="hidden rounded-full border-[#ebe7e0] bg-white px-4 font-semibold text-[#4b5565] shadow-[0_6px_14px_rgba(16,24,40,0.04)] sm:inline-flex">
          <Link href={loginHref}>
            <LogIn size={16} />
            {t("login")}
          </Link>
        </Button>
        <Button asChild className="rounded-full bg-[#d9142f] px-4 font-semibold text-white shadow-[0_8px_18px_rgba(217,20,47,0.16)] hover:bg-[#b90f25]">
          <Link href={registerHref}>{t("register")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="header-dropdown-group">
      <Button type="button" variant="outline" className="rounded-full border-[#ebe7e0] bg-white px-4 font-semibold text-[#4b5565] shadow-[0_6px_14px_rgba(16,24,40,0.04)]">
        <UserRound size={16} />
        <span className="hidden sm:inline">{t("account")}</span>
      </Button>
      <div className="header-dropdown-panel w-64 rounded-2xl border border-[#ebe7e0] bg-white p-2 shadow-[0_18px_42px_rgba(15,23,42,0.12)]">
        <div className="px-3 py-2">
          <div className="text-sm font-bold text-[#16202f]">{t("account")}</div>
          {auth.email ? <div className="mt-0.5 truncate text-xs font-semibold text-[#667085]">{auth.email}</div> : null}
        </div>
        <div className="grid gap-1">
          {accountItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-[#16202f] transition hover:bg-[#f8fafc]">
                <Icon size={16} />
                {t(item.key)}
              </Link>
            );
          })}
          <button type="button" onClick={onLogout} className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-[#d9142f] transition hover:bg-[#fff3f5]">
            <LogOut size={16} />
            {t("logout")}
          </button>
        </div>
      </div>
    </div>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
