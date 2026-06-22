"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { accountMenu } from "@/config/account-menu";
import { cn } from "@/lib/utils";

type MobileAccountSubnavProps = {
  className?: string;
  primaryOnly?: boolean;
};

const PRIMARY_KEYS = new Set([
  "dashboard",
  "orders",
  "packages",
  "wallet",
  "addresses",
  "ticketsCenter",
  "profile"
]);

export function MobileAccountSubnav({
  className,
  primaryOnly = false
}: MobileAccountSubnavProps) {
  const pathname = usePathname();
  const t = useTranslations("account.sidebar");
  const items = primaryOnly
    ? accountMenu.filter((item) => PRIMARY_KEYS.has(item.key))
    : accountMenu;

  return (
    <nav
      aria-label={t("title")}
      className={cn("mobile-account-subnav", className)}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.path ||
          (item.path !== "/account" && pathname.startsWith(`${item.path}/`));

        return (
          <Link
            key={item.path}
            href={item.path}
            className={cn("mobile-account-subnav-item", active && "is-active")}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-4" />
            <span>{t(`menu.${item.key}`)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
