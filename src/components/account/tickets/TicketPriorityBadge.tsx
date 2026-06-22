import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TicketPriority } from "@/types/ticket";

const priorityStyles: Record<TicketPriority, string> = {
  low: "border-slate-200 bg-white text-slate-500",
  normal: "border-sky-200 bg-sky-50 text-sky-700",
  high: "border-orange-200 bg-orange-50 text-orange-700",
  urgent: "border-rose-200 bg-rose-50 text-rose-700"
};

const priorityLabels: Record<TicketPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent"
};

export function TicketPriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <Badge variant="outline" className={cn("capitalize", priorityStyles[priority])}>
      {priorityLabels[priority]}
    </Badge>
  );
}
