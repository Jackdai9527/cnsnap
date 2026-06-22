"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { AccountUser } from "@/lib/account/mock-data";

type AccountHeaderProps = {
  user: AccountUser;
};

export function AccountHeader({ user }: AccountHeaderProps) {
  const pathname = usePathname();
  const t = useTranslations("account.header");
  const initials = user.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const hideOnMobileRoutes = [
    "/account",
    "/account/orders",
    "/account/packages",
    "/account/wallet",
    "/account/tickets",
    "/account/help",
    "/account/profile",
    "/account/addresses",
    "/account/billing",
    "/account/recharge",
    "/account/support",
    "/account/affiliate",
    "/account/coupons",
    "/account/favorites",
    "/account/diy-orders"
  ];
  const hideOnMobile = hideOnMobileRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  return (
    <header className={hideOnMobile ? "hidden md:block sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-xl" : "sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-xl"}>
      <div className="mx-auto flex min-h-16 w-full max-w-[1500px] items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger render={<Button variant="outline" size="icon-sm" className="lg:hidden" aria-label={t("openMenu")} />}>
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="w-[86vw] max-w-sm bg-[#f8fafc] p-3">
              <SheetHeader className="px-2">
                <SheetTitle>{t("menuTitle")}</SheetTitle>
              </SheetHeader>
              <AccountSidebar className="border-0 shadow-none" />
            </SheetContent>
          </Sheet>
          <div>
            <div className="text-sm font-black uppercase text-slate-950">{t("center")}</div>
            <div className="hidden text-xs font-medium text-slate-500 sm:block">{t("description")}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden border-sky-200 bg-sky-50 text-sky-700 sm:inline-flex">
            {t("balance", { amount: user.walletBalanceUsd.toFixed(2) })}
          </Badge>
          <Badge variant="outline" className="hidden border-slate-200 bg-white text-slate-600 md:inline-flex">
            {user.language}
          </Badge>
          <Badge variant="outline" className="hidden border-slate-200 bg-white text-slate-600 md:inline-flex">
            {user.currency}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger render={<button type="button" />} className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full px-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" aria-label={t("openAccountMenu")}>
              <Avatar>
                {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-36 truncate text-sm font-bold text-slate-700 sm:inline">{user.email}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="font-bold text-slate-950">{user.name}</div>
                <div className="truncate text-xs text-slate-500">{user.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/account/profile" />}>{t("profile")}</DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/account/wallet" />}>{t("wallet")}</DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/account/tickets" />}>{t("ticketsCenter")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-1.5 py-1">
                <LogoutButton callbackUrl="/login" className="w-full rounded-md px-2 py-1.5 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50">
                  {t("signOut")}
                </LogoutButton>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Separator />
    </header>
  );
}
