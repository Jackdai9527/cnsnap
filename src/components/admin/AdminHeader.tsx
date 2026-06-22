"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Menu, MonitorUp, Search, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { hasPermission } from "@/lib/auth/permissions";

type AdminHeaderUser = {
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  role: string;
};

type AdminHeaderProps = {
  user: AdminHeaderUser;
  languageSwitcher?: React.ReactNode;
};

function initials(user: AdminHeaderUser) {
  const source = user.name || user.email || "Admin";
  const words = source.split(/[.\s@_-]+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "A";
}

export function AdminHeader({ user, languageSwitcher }: AdminHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslations("common.header");
  const canViewOrders = hasPermission(user.role, "orders.view");
  const canManageAdminUsers = hasPermission(user.role, "admin_users.manage");
  const canManageRoles = hasPermission(user.role, "roles.manage");

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="flex min-h-[72px] items-center justify-between gap-4 px-4 sm:px-6 xl:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger render={<Button variant="outline" size="icon" className="lg:hidden" aria-label={t("openMenu")} />}>
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="w-[312px] max-w-[88vw] gap-0 p-0" showCloseButton>
              <SheetHeader className="sr-only">
                <SheetTitle>{t("navigation")}</SheetTitle>
                <SheetDescription>{t("navigationDesc")}</SheetDescription>
              </SheetHeader>
              <AdminSidebar userRole={user.role} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              <ShieldCheck size={14} />
              {t("operations")}
            </div>
            <h1 className="mt-0.5 truncate text-lg font-black text-slate-950">{t("console")}</h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {languageSwitcher}
          {canViewOrders ? (
            <Button asChild variant="outline" className="hidden border-slate-200 bg-white text-slate-700 hover:border-[#18a8d8] hover:bg-[#eef7ff] hover:text-[#0c8fbd] md:inline-flex">
              <Link href="/admin/orders">
                <Search />
                {t("orders")}
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline" className="hidden border-slate-200 bg-white text-slate-700 hover:border-[#ffb3cc] hover:bg-[#fff1f6] hover:text-[#ff1d5e] sm:inline-flex">
            <Link href="/" target="_blank">
              <MonitorUp />
              {t("viewSite")}
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger render={<button type="button" className="flex items-center gap-3 rounded-full border border-slate-200 bg-white p-1.5 pr-3 text-left shadow-sm transition hover:border-[#ffb3cc] hover:bg-[#fff8fb]" aria-label={t("openAccountMenu")} />}>
              <Avatar className="size-9">
                {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name ?? user.email} /> : null}
                <AvatarFallback className="bg-[#fff1f6] text-xs font-black text-[#ff1d5e]">{initials(user)}</AvatarFallback>
              </Avatar>
              <span className="hidden min-w-0 leading-tight sm:block">
                <span className="block max-w-[190px] truncate text-sm font-bold text-slate-900">{user.name || user.email}</span>
                <span className="block text-xs font-semibold capitalize text-slate-500">{user.role}</span>
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-2">
              <DropdownMenuLabel className="px-2 py-2">
                <span className="block text-sm font-black text-slate-950">{user.name || "Administrator"}</span>
                <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">{user.email}</span>
                <span className="mt-2 inline-flex rounded-full bg-[#eef7ff] px-2.5 py-1 text-xs font-black capitalize text-[#0c8fbd]">{user.role}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {canManageAdminUsers ? (
              <DropdownMenuItem render={<Link href="/admin/settings/admin-users" />}>
                  {t("adminUsers")}
              </DropdownMenuItem>
            ) : null}
            {canManageRoles ? (
              <DropdownMenuItem render={<Link href="/admin/settings/roles" />}>
                  {t("rolesPermissions")}
              </DropdownMenuItem>
            ) : null}
            {canManageAdminUsers || canManageRoles ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem render={<LogoutButton callbackUrl="/admin-login" logoutMode="admin" className="w-full text-left text-red-600" />}>
                {t("signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
