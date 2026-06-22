import { NextResponse } from "next/server";

const logoutCookieNames = [
  "haitao_user_id",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token"
];

export async function POST() {
  const response = NextResponse.json({ ok: true });
  for (const name of logoutCookieNames) {
    response.cookies.set(name, "", {
      httpOnly: name !== "next-auth.callback-url" && name !== "__Secure-next-auth.callback-url",
      path: "/",
      sameSite: "lax",
      maxAge: 0,
      expires: new Date(0),
      secure: name.startsWith("__Secure-") || name.startsWith("__Host-")
    });
  }
  return response;
}
