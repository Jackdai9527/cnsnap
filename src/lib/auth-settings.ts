import { prisma } from "@/lib/db";
import { isBuildTimeRuntime } from "@/lib/build-runtime";

type AuthSettingTuple = readonly [key: string, defaultValue: string, label: string, description: string];

export const authSettingGroups = [
  {
    id: "base",
    title: "Auth Base",
    description: "Core Auth.js settings used by every login method.",
    settings: [
      ["nextauth_url", "http://localhost:3000", "NextAuth URL", "Public site URL used for OAuth callbacks."],
      ["nextauth_secret", "", "NextAuth Secret", "Random secret for signing session tokens. Environment variables override this value."]
    ] as readonly AuthSettingTuple[]
  },
  {
    id: "apple",
    title: "Apple",
    description: "Callback URL: /api/auth/callback/apple",
    settings: [
      ["auth_apple_enabled", "false", "Enable Apple", "Set true after adding credentials."],
      ["auth_apple_id", "", "Apple Client ID", "Services ID from Apple Developer."],
      ["auth_apple_secret", "", "Apple Client Secret", "JWT client secret generated for Sign in with Apple."]
    ] as readonly AuthSettingTuple[]
  },
  {
    id: "google",
    title: "Google",
    description: "Callback URL: /api/auth/callback/google",
    settings: [
      ["auth_google_enabled", "false", "Enable Google", "Set true after adding credentials."],
      ["auth_google_id", "", "Google Client ID", "OAuth client ID."],
      ["auth_google_secret", "", "Google Client Secret", "OAuth client secret."]
    ] as readonly AuthSettingTuple[]
  },
  {
    id: "facebook",
    title: "Facebook",
    description: "Callback URL: /api/auth/callback/facebook",
    settings: [
      ["auth_facebook_enabled", "false", "Enable Facebook", "Set true after adding credentials."],
      ["auth_facebook_id", "", "Facebook App ID", "Meta app ID."],
      ["auth_facebook_secret", "", "Facebook App Secret", "Meta app secret."]
    ] as readonly AuthSettingTuple[]
  },
  {
    id: "discord",
    title: "Discord",
    description: "Callback URL: /api/auth/callback/discord",
    settings: [
      ["auth_discord_enabled", "false", "Enable Discord", "Set true after adding credentials."],
      ["auth_discord_id", "", "Discord Client ID", "Discord application client ID."],
      ["auth_discord_secret", "", "Discord Client Secret", "Discord application client secret."]
    ] as readonly AuthSettingTuple[]
  },
  {
    id: "github",
    title: "GitHub",
    description: "Callback URL: /api/auth/callback/github",
    settings: [
      ["auth_github_enabled", "false", "Enable GitHub", "Set true after adding credentials."],
      ["auth_github_id", "", "GitHub Client ID", "OAuth app client ID."],
      ["auth_github_secret", "", "GitHub Client Secret", "OAuth app client secret."]
    ] as readonly AuthSettingTuple[]
  },
  {
    id: "email",
    title: "Email",
    description: "Supports password login/register and optional magic-link email login.",
    settings: [
      ["auth_credentials_enabled", "true", "Enable Email Password", "Allow users to register and login with email/password."],
      ["auth_email_enabled", "false", "Enable Email Magic Link", "Set true after SMTP is configured."],
      ["auth_email_server", "", "SMTP Server URL", "Example: smtp://user:pass@smtp.example.com:587"],
      ["auth_email_from", "CNSnap <no-reply@localhost>", "Email From", "Sender address for magic-link emails."]
    ] as readonly AuthSettingTuple[]
  }
] as const;

export const authSettingKeys = authSettingGroups.flatMap((group) => group.settings.map(([key]) => key));

export async function ensureAuthSettings() {
  if (isBuildTimeRuntime()) return;
  for (const group of authSettingGroups) {
    for (const [key, value, label, description] of group.settings) {
      await prisma.setting.upsert({
        where: { key },
        update: { label, description },
        create: { key, value, label, description }
      });
    }
  }
}

export async function getAuthSettingsMap() {
  if (isBuildTimeRuntime()) {
    return new Map(authSettingGroups.flatMap((group) => group.settings.map(([key, value]) => [key, value])));
  }
  await ensureAuthSettings();
  const settings = await prisma.setting.findMany({
    where: { key: { in: authSettingKeys } }
  });
  return new Map(settings.map((setting) => [setting.key, setting.value]));
}

export function settingValue(map: Map<string, string>, key: string, envKey?: string) {
  return (envKey ? process.env[envKey] : undefined) || map.get(key) || "";
}

export function settingEnabled(map: Map<string, string>, key: string, envIdKey?: string, envSecretKey?: string) {
  const envReady = envIdKey && envSecretKey ? Boolean(process.env[envIdKey] && process.env[envSecretKey]) : false;
  return envReady || map.get(key) === "true";
}
