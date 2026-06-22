"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { adminMenu, hasPermission, type AdminMenuItem } from "@/config/admin-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type AdminSidebarProps = {
  className?: string;
  onNavigate?: () => void;
  userRole: string;
};

function normalizePath(path: string) {
  return path.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
}

function isPathActive(path: string, pathname: string, current: string) {
  const normalizedTarget = normalizePath(path);
  const normalizedPathname = normalizePath(pathname);

  if (current === path) return true;
  if (normalizedTarget === "/admin") return normalizedPathname === "/admin";
  return normalizedPathname === normalizedTarget || normalizedPathname.startsWith(`${normalizedTarget}/`);
}

function isMenuActive(item: AdminMenuItem, pathname: string, current: string) {
  if (item.path && isPathActive(item.path, pathname, current)) return true;
  return item.children?.some((child) => isPathActive(child.path, pathname, current)) ?? false;
}

export function AdminSidebar({ className, onNavigate, userRole }: AdminSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("menu");
  const current = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const visibleMenu = useMemo(() => {
    return adminMenu
      .map((item) => ({
        ...item,
        label: t(`items.${item.key}`),
        children: item.children?.filter((child) => hasPermission(userRole, child.permission))
          .map((child) => ({
            ...child,
            label: t(`items.${child.key}`)
          }))
      }))
      .filter((item) => (item.children ? item.children.length > 0 : Boolean(item.path && hasPermission(userRole, item.permission))));
  }, [t, userRole]);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  function toggleGroup(label: string) {
    setOpenGroups((previous) => ({ ...previous, [label]: !previous[label] }));
  }

  return (
    <aside className={cn("flex h-full min-h-0 flex-col bg-white text-slate-950", className)}>
      <div className="flex h-[72px] shrink-0 items-center px-4">
        <Link href="/admin" className="flex min-w-0 items-center gap-3" onClick={onNavigate} aria-label="CNSnap Admin dashboard">
          <Image
            src="/brand/cnsnap-logo.svg"
            alt="CNSnap Admin"
            width={1540}
            height={453}
            priority
            className="h-9 w-auto max-w-[170px]"
          />
        </Link>
      </div>

      <Separator />

      <div className="px-4 pb-2 pt-4">
        <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{t("section.operations")}</div>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-5">
        {visibleMenu.map((item) => {
          const Icon = item.icon;
          const active = isMenuActive(item, pathname, current);
          const children = item.children ?? [];
          const open = openGroups[item.label] ?? active;

          if (!children.length) {
            return (
              <Link
                key={item.label}
                href={item.path ?? "/admin"}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition",
                  active
                    ? "bg-[#fff1f6] text-[#ff1d5e] shadow-[inset_3px_0_0_#ff1d5e]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                )}
              >
                <Icon size={18} className="shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          }

          return (
            <section key={item.label} className="rounded-xl">
              <button
                type="button"
                onClick={() => toggleGroup(item.label)}
                className={cn(
                  "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition",
                  active
                    ? "bg-[#fff1f6] text-[#ff1d5e] shadow-[inset_3px_0_0_#ff1d5e]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                )}
                aria-expanded={open}
              >
                <Icon size={18} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <ChevronDown size={15} className={cn("shrink-0 transition-transform", open ? "rotate-180" : "")} />
              </button>

              {open ? (
                <div className="ml-6 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
                  {children.map((child) => {
                    const childActive = isPathActive(child.path, pathname, current);
                    return (
                      <Link
                        key={child.path}
                        href={child.path}
                        onClick={onNavigate}
                        aria-current={childActive ? "page" : undefined}
                        className={cn(
                          "block rounded-lg px-3 py-1.5 text-xs font-bold transition",
                          childActive ? "bg-[#eef7ff] text-[#18a8d8]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                        )}
                      >
                        <span className="line-clamp-1">{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </section>
          );
        })}
      </nav>
    </aside>
  );
}
