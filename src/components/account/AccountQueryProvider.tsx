"use client";

import { QueryProvider } from "@/components/providers/QueryProvider";

export function AccountQueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
