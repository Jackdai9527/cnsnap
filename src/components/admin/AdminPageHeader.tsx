import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type AdminPageHeaderProps = {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function AdminPageHeader({
  title,
  description,
  action,
  className,
}: AdminPageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}
