import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { buildAuthOptions } from "@/lib/auth";

export const inactiveUserMessage = "Your account has been blocked. Please contact support.";

export async function getCurrentUser() {
  const session = await getServerSession(await buildAuthOptions());
  if (session?.user?.id) {
    const sessionUser = await prisma.user.findUnique({ where: { id: Number(session.user.id) } });
    if (sessionUser) return sessionUser;
  }

  const cookieStore = await cookies();
  const userId = cookieStore.get("haitao_user_id")?.value;

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (user) {
      return user;
    }
  }

  return null;
}

export function isUserActive(status?: string | null) {
  return status === "active";
}

export async function requireActiveUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please sign in again.");
  if (!isUserActive(user.status)) throw new Error(inactiveUserMessage);
  return user;
}

export async function requireActiveUserPage(callbackUrl = "/account") {
  const user = await getCurrentUser();
  const localePrefix = callbackUrl.match(/^\/(zh|en|de|fr|it|pl|pt|es)(?=\/|$)/)?.[0] || "";
  if (!user) {
    redirect(`${localePrefix}/login?callbackUrl=${encodeURIComponent(callbackUrl)}`.replace("//login", "/login"));
  }
  if (!isUserActive(user.status)) {
    redirect(`${localePrefix}/login?callbackUrl=${encodeURIComponent(callbackUrl)}&error=account_blocked`.replace("//login", "/login"));
  }
  return user;
}
