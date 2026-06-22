import type { ReactNode } from "react";
import { BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ChartCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyText?: string;
  className?: string;
  heightClassName?: string;
};

export function ChartCard({
  title,
  description,
  children,
  loading = false,
  empty = false,
  emptyText = "No chart data available.",
  className,
  heightClassName = "h-[300px]"
}: ChartCardProps) {
  const t = useTranslations("dashboard.charts");

  return (
    <Card className={cn("admin-chart-scope border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)]", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-black text-slate-950">{title}</CardTitle>
        {description ? <p className="text-sm leading-6 text-slate-500">{description}</p> : null}
      </CardHeader>
      <CardContent>
        {loading ? (
          <ChartSkeleton className={heightClassName} />
        ) : empty ? (
          <ChartEmptyState className={heightClassName} text={emptyText} footer={t("emptyFooter")} />
        ) : (
          <div className={cn("min-h-0 min-w-0", heightClassName)}>{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-end gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4", className)}>
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={index}
          className="flex-1 animate-pulse rounded-t-xl bg-slate-200"
          style={{ height: `${28 + ((index * 19) % 68)}%` }}
        />
      ))}
    </div>
  );
}

function ChartEmptyState({ className, text, footer }: { className?: string; text: string; footer: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center", className)}>
      <div className="grid size-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-400">
        <BarChart3 className="size-5" />
      </div>
      <div className="mt-3 text-sm font-black text-slate-800">{text}</div>
      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{footer}</p>
    </div>
  );
}
