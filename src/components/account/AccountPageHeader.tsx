import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AccountPageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function AccountPageHeader({ title, description, action, className }: AccountPageHeaderProps) {
  return (
    <header className={cn("mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
