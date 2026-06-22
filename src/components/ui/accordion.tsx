"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

function Accordion({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="accordion" className={cn("grid gap-3", className)} {...props} />;
}

function AccordionItem({ className, ...props }: React.ComponentProps<"details">) {
  return (
    <details
      data-slot="accordion-item"
      className={cn(
        "group rounded-2xl border border-slate-200 bg-white/90 shadow-[0_12px_30px_rgba(15,23,42,0.04)]",
        className
      )}
      {...props}
    />
  );
}

function AccordionTrigger({ className, children, ...props }: React.ComponentProps<"summary">) {
  return (
    <summary
      data-slot="accordion-trigger"
      className={cn(
        "flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-left text-sm font-black text-slate-900 marker:hidden [&::-webkit-details-marker]:hidden",
        className
      )}
      {...props}
    >
      <span>{children}</span>
      <ChevronDown className="size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
    </summary>
  );
}

function AccordionContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="accordion-content"
      className={cn("px-4 pb-4 text-sm leading-6 text-slate-600", className)}
      {...props}
    />
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
