import { getAuthSettingsMap, settingEnabled, settingValue } from "@/lib/auth-settings";

export async function getEnabledAuthProviders() {
  const settings = await getAuthSettingsMap();
  const providers: string[] = [];

  if (settingEnabled(settings, "auth_credentials_enabled")) providers.push("credentials");
  for (const provider of ["apple", "google", "facebook", "discord", "github"]) {
    const upper = provider.toUpperCase();
    const id = settingValue(settings, `auth_${provider}_id`, `AUTH_${upper}_ID`);
    const secret = settingValue(settings, `auth_${provider}_secret`, `AUTH_${upper}_SECRET`);
    if ((settingEnabled(settings, `auth_${provider}_enabled`) || (id && secret)) && id && secret) {
      providers.push(provider);
    }
  }

  if ((settings.get("auth_email_enabled") === "true" || process.env.EMAIL_SERVER) && settingValue(settings, "auth_email_server", "EMAIL_SERVER")) {
    providers.push("email");
  }

  return providers;
}
