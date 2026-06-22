"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useMyAddresses() {
  return useQuery({
    queryKey: ["account", "addresses"],
    queryFn: async () => {
      const response = await fetch("/api/account/addresses", { cache: "no-store" });
      const payload = await response.json() as { addresses?: import("@/types/address").AccountAddress[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to load addresses.");
      return payload.addresses ?? [];
    },
    staleTime: 60_000
  });
}

export function useRefreshMyAddresses() {
  const queryClient = useQueryClient();
  return async function refreshMyAddresses() {
    await queryClient.invalidateQueries({ queryKey: ["account", "addresses"] });
    const result = await queryClient.fetchQuery({
      queryKey: ["account", "addresses"],
      queryFn: async () => {
        const response = await fetch("/api/account/addresses", { cache: "no-store" });
        const payload = await response.json() as { addresses?: import("@/types/address").AccountAddress[]; error?: string };
        if (!response.ok) throw new Error(payload.error || "Unable to load addresses.");
        return payload.addresses ?? [];
      }
    });
    return result;
  };
}
