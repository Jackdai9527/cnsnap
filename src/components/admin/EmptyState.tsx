import type { ReactNode } from "react"
import { Inbox } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type EmptyStateProps = {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center",
        className
      )}
    >
      <div className="grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500">
        {icon ?? <Inbox className="size-5" />}
      </div>
      <h2 className="mt-4 text-base font-semibold text-slate-950">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function EmptyStateAction({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return <Button {...props}>{children}</Button>
}
