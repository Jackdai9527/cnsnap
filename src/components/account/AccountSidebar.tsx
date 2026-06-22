"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { accountMenu } from "@/config/account-menu";
import { cn } from "@/lib/utils";

export function AccountSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const t = useTranslations("account.sidebar");

  return (
    <aside className={cn("rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_18px_45px_rgba(15,23,42,0.05)]", className)}>
      <div className="px-3 py-3">
        <div className="text-lg font-black tracking-tight text-slate-950">{t("title")}</div>
        <p className="mt-1 text-xs font-medium text-slate-500">{t("description")}</p>
      </div>
      <nav className="mt-2 grid gap-1">
        {accountMenu.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.path || (item.path !== "/account" && pathname.startsWith(`${item.path}/`));
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition",
                active
                  ? "bg-gradient-to-r from-pink-50 to-sky-50 text-slate-950 ring-1 ring-pink-100"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
              )}
            >
              <Icon className={cn("size-4", active ? "text-pink-500" : "text-slate-400")} />
              <span>{t(`menu.${item.key}`)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
