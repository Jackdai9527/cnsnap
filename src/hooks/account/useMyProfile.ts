"use client";

import { useQuery } from "@tanstack/react-query";
import { mockConnectedAccounts, mockUserProfile } from "@/lib/account/profile";

export function useMyProfile() {
  return useQuery({
    queryKey: ["account", "profile"],
    queryFn: async () => ({
      profile: mockUserProfile,
      connectedAccounts: mockConnectedAccounts
    }),
    staleTime: 60_000
  });
}
