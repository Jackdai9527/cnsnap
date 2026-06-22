"use client";

import { useQuery } from "@tanstack/react-query";
import type { TicketListItem } from "@/types/ticket";

export function useMyTickets() {
  return useQuery({
    queryKey: ["account", "tickets"],
    queryFn: async () => {
      const response = await fetch("/api/account/tickets", { cache: "no-store" });
      const payload = await response.json() as { tickets?: TicketListItem[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to load tickets.");
      return payload.tickets ?? [];
    },
    staleTime: 15_000
  });
}
