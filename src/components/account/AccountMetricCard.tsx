import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AccountMetricCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  className?: string;
};

export function AccountMetricCard({ title, value, description, icon, className }: AccountMetricCardProps) {
  return (
    <Card className={cn("border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.05)]", className)}>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{title}</div>
          <div className="mt-2 truncate text-2xl font-black tracking-tight text-slate-950">{value}</div>
          {description ? <p className="mt-1 text-sm font-medium text-slate-500">{description}</p> : null}
        </div>
        {icon ? <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-sky-50 text-sky-600">{icon}</div> : null}
      </CardContent>
    </Card>
  );
}
