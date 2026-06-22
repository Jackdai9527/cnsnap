export type UserProfile = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  userLevel: "normal" | "vip";
  walletBalance: number;
  language: string;
  currency: "USD" | "CNY";
  timezone: string;
  emailVerified: boolean;
  passwordEnabled: boolean;
  twoFactorEnabled: boolean;
  emailNotifications: boolean;
  marketingEmails: boolean;
  registeredAt: string;
  lastLoginAt?: string;
};

export type ConnectedAccount = {
  provider: "google";
  providerEmail: string;
  connectedAt: string;
  status: "connected" | "disconnected";
};
