import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSession } from "@/lib/admin-session";
import { isAdminRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const callbackUrl = String(body.callbackUrl || "/admin");

    if (!email || !password) {
      return NextResponse.json({ error: "Please enter both email and password." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash || !isAdminRole(user.role)) {
      return NextResponse.json({ error: "Invalid admin email or password." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid admin email or password." }, { status: 401 });
    }
    if (user.status !== "active") {
      return NextResponse.json({ error: "This admin account is disabled." }, { status: 403 });
    }

    await createAdminSession(user.id);

    return NextResponse.json({
      ok: true,
      callbackUrl
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Admin login failed." }, { status: 400 });
  }
}
