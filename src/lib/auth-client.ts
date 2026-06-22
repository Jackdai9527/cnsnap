"use client";

export async function ensureAuthenticated(callbackUrl = window.location.pathname + window.location.search) {
  const response = await fetch("/api/auth/me", {
    cache: "no-store",
    credentials: "same-origin"
  });
  if (response.ok) return true;
  const error = response.status === 403 ? "&error=account_blocked" : "";
  const localePrefix = window.location.pathname.startsWith("/zh/")
    || window.location.pathname === "/zh"
    ? "/zh"
    : window.location.pathname.startsWith("/de/")
      || window.location.pathname === "/de"
      ? "/de"
      : window.location.pathname.startsWith("/fr/")
        || window.location.pathname === "/fr"
        ? "/fr"
        : window.location.pathname.startsWith("/it/")
          || window.location.pathname === "/it"
          ? "/it"
          : window.location.pathname.startsWith("/pl/")
            || window.location.pathname === "/pl"
            ? "/pl"
            : window.location.pathname.startsWith("/pt/")
              || window.location.pathname === "/pt"
              ? "/pt"
              : window.location.pathname.startsWith("/es/")
                || window.location.pathname === "/es"
                ? "/es"
                : window.location.pathname.startsWith("/en/")
                  || window.location.pathname === "/en"
                  ? "/en"
                  : "";
  window.location.href = `${localePrefix}/login?callbackUrl=${encodeURIComponent(callbackUrl)}${error}`.replace("//login", "/login");
  return false;
}
