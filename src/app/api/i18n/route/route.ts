import { NextResponse } from "next/server";
import { isFrontendLocale } from "../../../../../config/i18n";
import { resolveLocalizedRoute } from "@/modules/seo/lib/route-translation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pathname = searchParams.get("pathname") || "/";
  const locale = searchParams.get("locale");

  if (!isFrontendLocale(locale)) {
    return NextResponse.json({ error: "Unsupported locale." }, { status: 400 });
  }

  const resolved = await resolveLocalizedRoute(pathname, locale);
  return NextResponse.json(resolved);
}
