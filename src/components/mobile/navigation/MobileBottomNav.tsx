"use client";

import Link from "next/link";
import { House, ReceiptText, ShoppingCart, UserRound } from "lucide-react";
import { useMemo, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cartSnapshot, parseCartSnapshot, subscribeToCart, summarizeCart } from "@/lib/cart-store";
import { ensureAuthenticated } from "@/lib/auth-client";
import type { FrontendLanguageOption } from "@/lib/i18n/frontend";
import { normalizeMobileBusinessPath } from "@/lib/mobile-footer-rules";
import { cn } from "@/lib/utils";
import { resolveFrontendHrefForLocale } from "@/modules/seo/lib/route-resolver";

type MobileBottomNavProps = {
  pageLanguage?: FrontendLanguageOption["code"];
  auth?: {
    authenticated: boolean;
  };
};

type MobileBottomNavItem = {
  key: "home" | "cart" | "orders" | "account";
  label: string;
  href: string;
  icon: typeof House;
  badge?: number;
};

export function MobileBottomNav({
  pageLanguage = "en",
  auth = { authenticated: false }
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const navT = useTranslations("nav");
  const cartT = useTranslations("common.header.cart");
  const snapshot = useSyncExternalStore(subscribeToCart, cartSnapshot, () => "[]");
  const items = useMemo(() => parseCartSnapshot(snapshot), [snapshot]);
  const summary = useMemo(() => summarizeCart(items), [items]);
  const normalizedPath = normalizeMobileBusinessPath(pathname);

  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/admin") ||
    normalizedPath === "/search" ||
    normalizedPath.startsWith("/search/") ||
    normalizedPath === "/checkout" ||
    normalizedPath.startsWith("/checkout/") ||
    normalizedPath === "/product/buy" ||
    normalizedPath.startsWith("/product/buy/")
  ) {
    return null;
  }

  const localizedHref = (targetPath: string) =>
    resolveFrontendHrefForLocale({
      pathname: targetPath,
      locale: pageLanguage
    });

  const cartHref = localizedHref("/cart");
  const ordersHref = localizedHref("/account/orders");
  const accountHref = localizedHref(auth.authenticated ? "/account" : "/login");

  const navItems: MobileBottomNavItem[] = [
    {
      key: "home",
      label: navT("home"),
      href: localizedHref("/"),
      icon: House
    },
    {
      key: "cart",
      label: cartT("title"),
      href: cartHref,
      icon: ShoppingCart,
      badge: summary.quantity
    },
    {
      key: "orders",
      label: navT("orders"),
      href: ordersHref,
      icon: ReceiptText
    },
    {
      key: "account",
      label: navT("account"),
      href: accountHref,
      icon: UserRound
    }
  ] as const;

  async function handleProtectedNavigate(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    requiresAuth: boolean
  ) {
    if (!requiresAuth) return;
    event.preventDefault();
    if (await ensureAuthenticated(href)) {
      window.location.assign(href);
    }
  }

  return (
    <nav className="mobile-bottom-nav lg:hidden" aria-label="Mobile quick navigation">
      <div className="mobile-bottom-nav-shell">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isBottomNavItemActive(pathname, item.key, item.href);
          const requiresAuth = item.key === "cart" || item.key === "orders" || (item.key === "account" && auth.authenticated);

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn("mobile-bottom-nav-item", active && "is-active")}
              aria-current={active ? "page" : undefined}
              onClick={(event) => handleProtectedNavigate(event, item.href, requiresAuth)}
            >
              <span className="mobile-bottom-nav-icon-wrap">
                <Icon size={16} />
                {item.badge ? <span className="mobile-bottom-nav-badge">{item.badge}</span> : null}
              </span>
              <span className="mobile-bottom-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function isActivePath(pathname: string, href: string, exactOnly = false) {
  if (href === "/") return pathname === "/";
  if (exactOnly) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isBottomNavItemActive(pathname: string, key: MobileBottomNavItem["key"], href: string) {
  if (key === "home") return pathname === href;
  if (key === "orders") return pathname === href || pathname.startsWith(`${href}/`);
  if (key === "account") return pathname === href;
  return isActivePath(pathname, href);
}
