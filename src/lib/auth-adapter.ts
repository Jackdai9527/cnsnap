import type { Adapter, AdapterAccount, AdapterUser, VerificationToken } from "next-auth/adapters";
import { prisma } from "@/lib/db";
import { generateReferralCode } from "@/lib/referral";

function toAdapterUser(user: {
  id: number;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  updatedAt?: Date;
}): AdapterUser {
  return {
    id: String(user.id),
    email: user.email,
    emailVerified: null,
    name: user.name,
    image: user.avatarUrl
  };
}

export function haitaoAuthAdapter(): Adapter {
  return {
    async createUser(user: Omit<AdapterUser, "id">) {
      const email = user.email.toLowerCase().trim();
      const dbUser = await prisma.user.upsert({
        where: { email },
        update: {
          name: user.name ?? undefined,
          avatarUrl: user.image ?? undefined
        },
        create: {
          email,
          name: user.name ?? email.split("@")[0],
          avatarUrl: user.image ?? undefined,
          referralCode: generateReferralCode(email)
        }
      });

      return toAdapterUser(dbUser);
    },
    async getUser(id: string) {
      const numericId = Number(id);
      if (!Number.isInteger(numericId)) return null;
      const user = await prisma.user.findUnique({ where: { id: numericId } });
      return user ? toAdapterUser(user) : null;
    },
    async getUserByEmail(email: string) {
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      return user ? toAdapterUser(user) : null;
    },
    async getUserByAccount({ provider, providerAccountId }: Pick<AdapterAccount, "provider" | "providerAccountId">) {
      const account = await prisma.authAccount.findUnique({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId
          }
        },
        include: { user: true }
      });
      return account ? toAdapterUser(account.user) : null;
    },
    async updateUser(user: Partial<AdapterUser> & Pick<AdapterUser, "id">) {
      const dbUser = await prisma.user.update({
        where: { id: Number(user.id) },
        data: {
          email: user.email?.toLowerCase().trim(),
          name: user.name,
          avatarUrl: user.image
        }
      });
      return toAdapterUser(dbUser);
    },
    async linkAccount(account: AdapterAccount) {
      await prisma.authAccount.upsert({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId
          }
        },
        update: serializeAccount(account),
        create: serializeAccount(account)
      });
      return account;
    },
    async createVerificationToken(token: VerificationToken) {
      await prisma.authVerificationToken.create({
        data: token
      });
      return token;
    },
    async useVerificationToken(params: { identifier: string; token: string }) {
      const token = await prisma.authVerificationToken.findUnique({
        where: {
          identifier_token: params
        }
      });
      if (!token) return null;

      await prisma.authVerificationToken.delete({
        where: {
          identifier_token: params
        }
      });

      return {
        identifier: token.identifier,
        token: token.token,
        expires: token.expires
      };
    }
  };
}

function serializeAccount(account: AdapterAccount) {
  return {
    userId: Number(account.userId),
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    type: account.type,
    refreshToken: account.refresh_token,
    accessToken: account.access_token,
    expiresAt: account.expires_at,
    tokenType: account.token_type,
    scope: account.scope,
    idToken: account.id_token,
    sessionState: account.session_state ? String(account.session_state) : null
  };
}
