import type { NextAuthOptions, User as NextAuthUser } from "next-auth";
import AppleProvider from "next-auth/providers/apple";
import CredentialsProvider from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";
import EmailProvider from "next-auth/providers/email";
import FacebookProvider from "next-auth/providers/facebook";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import type { Provider } from "next-auth/providers/index";
import { haitaoAuthAdapter } from "@/lib/auth-adapter";
import { prisma } from "@/lib/db";
import { generateReferralCode } from "@/lib/referral";
import { getAuthSettingsMap, settingEnabled, settingValue } from "@/lib/auth-settings";

type AuthUser = NextAuthUser & {
  id: string;
  role?: string;
};

export async function buildAuthOptions(): Promise<NextAuthOptions> {
  const settings = await getAuthSettingsMap();
  const nextAuthUrl = settingValue(settings, "nextauth_url", "NEXTAUTH_URL") || process.env.APP_URL || "http://localhost:3000";
  const nextAuthSecret = settingValue(settings, "nextauth_secret", "NEXTAUTH_SECRET") || process.env.AUTH_SECRET || "haitao-local-dev-secret";
  const providers: Provider[] = [];

  process.env.NEXTAUTH_URL ||= nextAuthUrl;
  process.env.NEXTAUTH_SECRET ||= nextAuthSecret;

  if (settingEnabled(settings, "auth_credentials_enabled")) {
    providers.push(
      CredentialsProvider({
        name: "Email",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
          const email = credentials?.email?.toLowerCase().trim();
          const password = credentials?.password ?? "";
          if (!email || !password) return null;

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user?.passwordHash) return null;

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid || user.status !== "active") return null;

          return {
            id: String(user.id),
            email: user.email,
            name: user.name,
            image: user.avatarUrl,
            role: user.role
          } satisfies AuthUser;
        }
      })
    );
  }

  addOAuthProvider(providers, settings, "apple", AppleProvider, "AUTH_APPLE_ID", "AUTH_APPLE_SECRET");
  addGoogleProvider(providers, settings);
  addOAuthProvider(providers, settings, "facebook", FacebookProvider, "AUTH_FACEBOOK_ID", "AUTH_FACEBOOK_SECRET");
  addOAuthProvider(providers, settings, "discord", DiscordProvider, "AUTH_DISCORD_ID", "AUTH_DISCORD_SECRET");
  addOAuthProvider(providers, settings, "github", GitHubProvider, "AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET");

  const emailServer = settingValue(settings, "auth_email_server", "EMAIL_SERVER");
  if ((process.env.EMAIL_SERVER || settings.get("auth_email_enabled") === "true") && emailServer) {
    providers.push(
      EmailProvider({
        server: emailServer,
        from: settingValue(settings, "auth_email_from", "EMAIL_FROM") || "CNSnap <no-reply@localhost>"
      })
    );
  }

  return {
    adapter: haitaoAuthAdapter(),
    providers,
    secret: nextAuthSecret,
    session: {
      strategy: "jwt"
    },
    pages: {
      signIn: "/login",
      error: "/login"
    },
    callbacks: {
      async signIn({ user, account, profile }) {
        if (account?.provider === "credentials") return true;
        const email = user.email?.toLowerCase().trim();
        if (!email) return false;

        const dbUser = await prisma.user.upsert({
          where: { email },
          update: {
            name: user.name ?? profile?.name ?? undefined,
            avatarUrl: user.image ?? undefined,
            googleId: account?.provider === "google" ? account.providerAccountId : undefined
          },
          create: {
            email,
            name: user.name ?? profile?.name ?? email.split("@")[0],
            avatarUrl: user.image ?? undefined,
            googleId: account?.provider === "google" ? account.providerAccountId : undefined,
            referralCode: generateReferralCode(email)
          }
        });

        (user as AuthUser).id = String(dbUser.id);
        (user as AuthUser).role = dbUser.role;
        return dbUser.status === "active";
      },
      async jwt({ token, user }) {
        if (user?.email) {
          const dbUser = await prisma.user.findUnique({ where: { email: user.email.toLowerCase() } });
          if (dbUser) {
            token.id = String(dbUser.id);
            token.role = dbUser.role;
          }
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.id = String(token.id ?? "");
          session.user.role = String(token.role ?? "user");
        }
        return session;
      }
    }
  };
}

function addGoogleProvider(providers: Provider[], settings: Map<string, string>) {
  if (!settingEnabled(settings, "auth_google_enabled", "AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET")) return;

  const clientId = settingValue(settings, "auth_google_id", "AUTH_GOOGLE_ID");
  const clientSecret = settingValue(settings, "auth_google_secret", "AUTH_GOOGLE_SECRET");
  if (!clientId || !clientSecret) return;

  providers.push({
    id: "google",
    name: "Google",
    type: "oauth",
    clientId,
    clientSecret,
    issuer: "https://accounts.google.com",
    authorization: {
      url: "https://accounts.google.com/o/oauth2/v2/auth",
      params: {
        scope: "openid email profile",
        prompt: "select_account",
        access_type: "offline",
        response_type: "code"
      }
    },
    token: "https://oauth2.googleapis.com/token",
    userinfo: "https://openidconnect.googleapis.com/v1/userinfo",
    jwks_endpoint: "https://www.googleapis.com/oauth2/v3/certs",
    idToken: true,
    checks: ["pkce", "state"],
    allowDangerousEmailAccountLinking: true,
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.picture
      };
    },
    style: {
      logo: "/google.svg",
      bg: "#fff",
      text: "#000"
    }
  });
}

function addOAuthProvider(
  providers: Provider[],
  settings: Map<string, string>,
  id: "apple" | "google" | "facebook" | "discord" | "github",
  providerFactory: (options: { clientId: string; clientSecret: string; allowDangerousEmailAccountLinking?: boolean }) => Provider,
  envIdKey: string,
  envSecretKey: string
) {
  if (!settingEnabled(settings, `auth_${id}_enabled`, envIdKey, envSecretKey)) return;

  const clientId = settingValue(settings, `auth_${id}_id`, envIdKey);
  const clientSecret = settingValue(settings, `auth_${id}_secret`, envSecretKey);
  if (!clientId || !clientSecret) return;

  providers.push(
    providerFactory({
      clientId,
      clientSecret,
      allowDangerousEmailAccountLinking: true
    })
  );
}
