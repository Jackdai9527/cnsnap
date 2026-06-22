import { NextResponse } from "next/server";
import { getCurrentUser, inactiveUserMessage, isUserActive } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ authenticated: false }, { status: 401 });
  if (!isUserActive(user.status)) {
    return NextResponse.json({ authenticated: false, error: inactiveUserMessage }, { status: 403 });
  }
  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  });
}
