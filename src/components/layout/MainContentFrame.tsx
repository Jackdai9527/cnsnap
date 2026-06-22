"use client";

import { cn } from "@/lib/utils";

export function MainContentFrame({ children }: { children: React.ReactNode }) {
  return (
    <main
      className={cn(
        "relative sm:pb-0",
        "pb-0"
      )}
    >
      {children}
    </main>
  );
}
