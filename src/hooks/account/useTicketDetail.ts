"use client";

import { useQuery } from "@tanstack/react-query";
import type { TicketDetail } from "@/types/ticket";

export function useTicketDetail(id: string) {
  return useQuery({
    queryKey: ["account", "tickets", id],
    queryFn: async () => {
      const response = await fetch(`/api/account/tickets/${encodeURIComponent(id)}`, { cache: "no-store" });
      const payload = await response.json() as { ticket?: TicketDetail | null; error?: string };
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(payload.error || "Unable to load ticket.");
      return payload.ticket ?? null;
    },
    staleTime: 15_000
  });
}
