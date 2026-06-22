import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hasPermission, isAdminRole } from "@/lib/auth/permissions";

const adminSessionCookieName = "haitao_admin_session";
const adminSessionDurationMs = 1000 * 60 * 60 * 24 * 14;

export async function createAdminSession(userId: number) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + adminSessionDurationMs);

  await prisma.authVerificationToken.create({
    data: {
      identifier: `${adminSessionCookieName}:${userId}`,
      token,
      expires: expiresAt
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(adminSessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminSessionCookieName)?.value;

  if (token) {
    await prisma.authVerificationToken.deleteMany({
      where: { token }
    });
  }

  cookieStore.set(adminSessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0)
  });
}

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminSessionCookieName)?.value;
  if (!token) return null;

  const record = await prisma.authVerificationToken.findUnique({
    where: { token }
  });

  if (!record || record.expires <= new Date()) {
    if (record) {
      await prisma.authVerificationToken.delete({
        where: { token }
      }).catch(() => null);
    }
    cookieStore.set(adminSessionCookieName, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
      expires: new Date(0)
    });
    return null;
  }

  const rawUserId = record.identifier.replace(`${adminSessionCookieName}:`, "");
  const userId = Number(rawUserId);
  if (!Number.isInteger(userId) || userId <= 0) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || !isAdminRole(user.role) || user.status !== "active") {
    return null;
  }

  return user;
}

export async function requireAdmin() {
  const user = await getCurrentAdmin();
  if (!user) throw new Error("Admin access required.");
  return user;
}

export async function requirePermission(permission: string) {
  const user = await requireAdmin();
  if (!hasPermission(user.role, permission)) throw new Error(`Permission required: ${permission}`);
  return user;
}

export async function requireAdminPage(callbackUrl = "/admin") {
  const user = await getCurrentAdmin();
  if (!user) {
    redirect(`/admin-login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return user;
}

export { adminSessionCookieName };
