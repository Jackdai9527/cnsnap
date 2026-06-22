import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

type AccountEmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function AccountEmptyState({ title, description, icon, action, className }: AccountEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/90 p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.04)]",
        className
      )}
    >
      <div className="grid size-12 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500">
        {icon ?? <Inbox className="size-5" />}
      </div>
      <h2 className="mt-4 text-base font-black text-slate-950">{title}</h2>
      {description ? <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
