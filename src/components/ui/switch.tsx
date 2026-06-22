"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { cn } from "@/lib/utils";

function Switch({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="switch"
      className={cn(
        "group inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-slate-200 p-0.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-checked:bg-slate-950",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        keepMounted
        className="block size-5 rounded-full bg-white shadow-sm transition-transform group-data-checked:translate-x-5"
      />
    </CheckboxPrimitive.Root>
  );
}

export { Switch };
