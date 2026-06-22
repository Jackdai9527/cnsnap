import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/types/ticket";

const statusStyles: Record<TicketStatus, string> = {
  open: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  replied: "border-sky-200 bg-sky-50 text-sky-700",
  resolved: "border-slate-200 bg-slate-50 text-slate-700",
  closed: "border-zinc-200 bg-zinc-50 text-zinc-500"
};

const statusLabels: Record<TicketStatus, string> = {
  open: "Open",
  pending: "Pending",
  replied: "Replied",
  resolved: "Resolved",
  closed: "Closed"
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge variant="outline" className={cn("capitalize", statusStyles[status])}>
      {statusLabels[status]}
    </Badge>
  );
}
