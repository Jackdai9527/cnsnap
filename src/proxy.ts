import { NextRequest, NextResponse } from "next/server";
import { isSeoLocale, normalizeSeoLocaleCandidate } from "../config/i18n";

const SEO_REDIRECT_PREFIXES = [
  "/estimation",
  "/promotion",
  "/diy-order",
  "/forwarding",
  "/help",
  "/blog",
  "/platforms",
  "/shipping-to",
  "/campaign"
] as const;

function isLegacySeoPath(pathname: string) {
  return SEO_REDIRECT_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  const firstSegment = pathname.split("/").filter(Boolean)[0];

  requestHeaders.set("x-app-route-scope", pathname.startsWith("/admin") ? "admin" : "frontend");

  const normalizedFirstSegment = normalizeSeoLocaleCandidate(firstSegment);
  if (normalizedFirstSegment && isSeoLocale(normalizedFirstSegment)) {
    requestHeaders.set("x-app-seo-locale", normalizedFirstSegment);
  } else {
    requestHeaders.delete("x-app-seo-locale");
  }

  if (pathname === "/") {
    const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
    const headerLocales = request.headers.get("accept-language");
    const preferredFromCookie = normalizeSeoLocaleCandidate(cookieLocale);
    const preferredFromBrowser = headerLocales
      ? headerLocales
        .split(",")
        .map((part) => part.split(";")[0]?.trim())
        .filter(Boolean)
        .map((part) => normalizeSeoLocaleCandidate(part))
        .find((locale): locale is NonNullable<ReturnType<typeof normalizeSeoLocaleCandidate>> => Boolean(locale))
      : undefined;
    const nextLocale = preferredFromCookie || preferredFromBrowser || "en";
    const url = request.nextUrl.clone();
    url.pathname = `/${nextLocale}`;
    return NextResponse.redirect(url, 302);
  }

  if (pathname === "/zh-CN" || pathname.startsWith("/zh-CN/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/zh-CN(?=\/|$)/, "/zh");
    return NextResponse.redirect(url, 302);
  }

  if (pathname === "/cn/page/buy" || pathname.startsWith("/cn/page/buy/")) {
    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    });
  }

  if (pathname === "/cn" || pathname.startsWith("/cn/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/cn(?=\/|$)/, "/zh");
    return NextResponse.redirect(url, 302);
  }

  if (isLegacySeoPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/en${pathname}`;
    return NextResponse.redirect(url, 302);
  }

  if (pathname === "/user" || pathname.startsWith("/user/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/user" ? "/account" : pathname.replace(/^\/user/, "/account");
    return NextResponse.redirect(url);
  }

  if (pathname === "/account/messages" || pathname.startsWith("/account/messages/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/account/messages" ? "/account/tickets" : pathname.replace(/^\/account\/messages/, "/account/tickets");
    return NextResponse.redirect(url);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"]
};
