import type { ConnectedAccount, UserProfile } from "@/types/profile";

export const mockUserProfile: UserProfile = {
  id: "10001",
  email: "dguoquan60@gmail.com",
  name: "Jack Chen",
  avatarUrl: "",
  phone: "+1 415 847 1928",
  whatsapp: "+1 415 847 1928",
  telegram: "jack_cnsnap",
  userLevel: "normal",
  walletBalance: 128.5,
  language: "en",
  currency: "USD",
  timezone: "UTC",
  emailVerified: true,
  passwordEnabled: true,
  twoFactorEnabled: false,
  emailNotifications: true,
  marketingEmails: false,
  registeredAt: "2026-05-18 10:24",
  lastLoginAt: "2026-06-13 09:12"
};

export const mockConnectedAccounts: ConnectedAccount[] = [
  {
    provider: "google",
    providerEmail: "jack.chen@gmail.com",
    connectedAt: "2026-06-01 14:36",
    status: "connected"
  }
];
