"use client";

import { useEffect } from "react";

const storageKey = "cnsnap_theme";
type ThemeMode = "light" | "dark";

function getStoredTheme(): ThemeMode | null {
  try {
    const localTheme = window.localStorage?.getItem(storageKey);
    if (localTheme === "dark" || localTheme === "light") return localTheme;
  } catch {}

  const cookieTheme = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${storageKey}=`))
    ?.split("=")[1];

  return cookieTheme === "dark" || cookieTheme === "light" ? cookieTheme : null;
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

function isAdminRoute(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/admin-login";
}

export function ThemeSync() {
  useEffect(() => {
    if (isAdminRoute(window.location.pathname)) {
      applyTheme("light");
      return;
    }

    const storedTheme = getStoredTheme();
    if (storedTheme) {
      applyTheme(storedTheme);
      return;
    }

    if (!document.documentElement.dataset.theme) {
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  return null;
}
