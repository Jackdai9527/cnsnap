"use client";

import { Globe2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { LocaleConfig } from "../../../config/i18n";
import { updateAdminLanguage } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

type AdminLanguageSwitcherProps = {
  locale: string;
  locales: LocaleConfig[];
  label: string;
  title: string;
  description: string;
};

export function AdminLanguageSwitcher({
  locale,
  locales,
  label,
  title,
  description
}: AdminLanguageSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState(locale);
  const current = locales.find((item) => item.locale === selected) ?? locales[0];

  function changeLanguage(nextLocale: string) {
    if (nextLocale === selected) return;

    startTransition(async () => {
      await updateAdminLanguage(nextLocale);
      setSelected(nextLocale);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:border-[#18a8d8] hover:bg-[#eef7ff] hover:text-[#0c8fbd]"
            aria-label={label}
            disabled={isPending}
          >
            <Globe2 size={16} />
            {current?.nativeName ?? selected}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-64 p-2">
        <DropdownMenuLabel className="px-2 py-2">
          <div className="text-sm font-black text-slate-950">{title}</div>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{description}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {locales.map((item) => (
          <DropdownMenuItem
            key={item.locale}
            onClick={() => changeLanguage(item.locale)}
            className="rounded-xl px-3 py-2.5 font-bold"
          >
            <span className="min-w-0 flex-1">{item.nativeName}</span>
            <span className="text-xs font-semibold text-slate-400">{item.locale}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
