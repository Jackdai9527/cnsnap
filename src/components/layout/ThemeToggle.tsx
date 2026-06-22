"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type ThemeMode = "light" | "dark";

const storageKey = "cnsnap_theme";

function getThemeSnapshot(): ThemeMode {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerThemeSnapshot(): ThemeMode {
  return "light";
}

function subscribeToThemeChange(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, { attributeFilter: ["data-theme"], attributes: true });

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("cnsnap-theme-change", onStoreChange);

  return () => {
    observer.disconnect();
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("cnsnap-theme-change", onStoreChange);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToThemeChange, getThemeSnapshot, getServerThemeSnapshot);

  function applyTheme(nextTheme: ThemeMode) {
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.style.colorScheme = nextTheme;
    try {
      localStorage.setItem(storageKey, nextTheme);
    } catch {}
    document.cookie = `${storageKey}=${nextTheme}; path=/; max-age=31536000; samesite=lax`;
    window.dispatchEvent(new Event("cnsnap-theme-change"));
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle-btn"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      onClick={() => applyTheme(isDark ? "light" : "dark")}
    >
      <span className="theme-toggle-track">
        <span className="theme-toggle-thumb">{isDark ? <Moon size={14} /> : <Sun size={14} />}</span>
      </span>
    </button>
  );
}
