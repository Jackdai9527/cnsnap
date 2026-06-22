export function getThemeScript() {
  return `
    (function () {
      try {
        var pathname = window.location.pathname || "";
        var isAdminRoute = pathname === "/admin" || pathname.indexOf("/admin/") === 0 || pathname === "/admin-login";
        var theme = null;

        if (isAdminRoute) {
          theme = "light";
        } else {
          try {
            theme = window.localStorage ? window.localStorage.getItem("cnsnap_theme") : null;
          } catch (_) {}

          if (theme !== "dark" && theme !== "light") {
            var cookieMatch = document.cookie.match(/(?:^|; )cnsnap_theme=(dark|light)(?:;|$)/);
            theme = cookieMatch ? cookieMatch[1] : null;
          }

          if (theme !== "dark" && theme !== "light") {
            var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
            theme = prefersDark ? "dark" : "light";
          }
        }

        document.documentElement.dataset.theme = theme;
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.style.colorScheme = theme;
      } catch (_) {}
    })();
  `;
}
