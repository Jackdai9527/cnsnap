"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { ChevronUp, Headset, QrCode, ShoppingCart, Smartphone } from "lucide-react";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import { ensureAuthenticated } from "@/lib/auth-client";
import { buildLocalizedUiHref } from "@/lib/i18n/frontend-routing";
import { cartSnapshot, parseCartSnapshot, subscribeToCart, summarizeCart } from "@/lib/cart-store";
import { getSeoLocaleByAppLocale } from "../../../config/i18n";

type DesktopFloatingBarProps = {
  publicLocale?: string;
  supportEmail: string;
  appQrCodeUrl?: string;
  iosDownloadUrl?: string;
  androidDownloadUrl?: string;
  discordUrl?: string;
};

export function DesktopFloatingBar({
  publicLocale,
  supportEmail,
  appQrCodeUrl,
  iosDownloadUrl,
  androidDownloadUrl,
  discordUrl
}: DesktopFloatingBarProps) {
  const t = useTranslations("common.header.floating");
  const locale = useLocale();
  const effectivePublicLocale = publicLocale || getSeoLocaleByAppLocale(locale) || undefined;
  const pathname = usePathname();
  const snapshot = useSyncExternalStore(subscribeToCart, cartSnapshot, () => "[]");
  const items = useMemo(() => parseCartSnapshot(snapshot), [snapshot]);
  const summary = useMemo(() => summarizeCart(items), [items]);
  const { formatUsd } = useCurrency();
  const [activePanel, setActivePanel] = useState<"app" | "support" | null>(null);

  if (pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/admin-login" || pathname.startsWith("/checkout")) {
    return null;
  }

  async function guardedCartNavigate(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const cartHref = buildLocalizedUiHref("/cart", locale as never, undefined, effectivePublicLocale);
    if (await ensureAuthenticated(cartHref)) {
      window.location.href = cartHref;
    }
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const helpHref = buildLocalizedUiHref("/help", locale as never, undefined, effectivePublicLocale);

  return (
    <aside className="desktop-float hidden xl:flex" aria-label={t("quickActions")}>
      <div className="desktop-float-stack">
        <Link
          href={buildLocalizedUiHref("/cart", locale as never, undefined, effectivePublicLocale)}
          onClick={guardedCartNavigate}
          className="desktop-float-btn"
          aria-label={t("cartAria", { count: summary.quantity })}
          onMouseEnter={() => setActivePanel(null)}
        >
          <span className="desktop-float-badge">{summary.quantity || 0}</span>
          <ShoppingCart size={18} />
        </Link>

        <button
          type="button"
          className={`desktop-float-btn ${activePanel === "app" ? "is-active" : ""}`}
          onMouseEnter={() => setActivePanel("app")}
          aria-label={t("downloadApp")}
        >
          <Smartphone size={18} />
        </button>

        <button
          type="button"
          className={`desktop-float-btn ${activePanel === "support" ? "is-active" : ""}`}
          onMouseEnter={() => setActivePanel("support")}
          aria-label={t("support")}
        >
          <Headset size={18} />
        </button>

        <a
          href={discordUrl || "https://discord.gg/t7xmAYwZhU"}
          target="_blank"
          rel="noreferrer"
          className="desktop-float-btn"
          aria-label={t("joinDiscord")}
          onMouseEnter={() => setActivePanel(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/floating-discord.svg" alt="Discord" width={18} height={18} className="desktop-float-discord-icon" />
        </a>
      </div>

      <button type="button" className="desktop-float-top" onClick={scrollToTop} aria-label={t("backToTop")}>
        <ChevronUp size={16} />
      </button>

      {activePanel === "app" ? (
        <div className="desktop-float-panel desktop-float-panel-app" onMouseLeave={() => setActivePanel(null)}>
          <div className="desktop-float-panel-title">{t("downloadTitle")}</div>
          <div className="desktop-float-qr">
            {appQrCodeUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={appQrCodeUrl} alt="CNSnap App QR code" className="desktop-float-qr-image" />
            ) : (
              <QrCode size={74} />
            )}
            <span>{appQrCodeUrl ? t("scanToDownload") : t("appPreparing")}</span>
          </div>
          <div className="desktop-float-app-links">
            <a
              href={iosDownloadUrl || "#"}
              target={iosDownloadUrl ? "_blank" : undefined}
              rel={iosDownloadUrl ? "noreferrer" : undefined}
              className="desktop-float-app-link"
              onClick={(event) => {
                if (!iosDownloadUrl) event.preventDefault();
              }}
            >
              <span className="desktop-float-app-kicker">{t("ios")}</span>
              <span>{t("appStore")}</span>
            </a>
            <a
              href={androidDownloadUrl || "#"}
              target={androidDownloadUrl ? "_blank" : undefined}
              rel={androidDownloadUrl ? "noreferrer" : undefined}
              className="desktop-float-app-link"
              onClick={(event) => {
                if (!androidDownloadUrl) event.preventDefault();
              }}
            >
              <span className="desktop-float-app-kicker">{t("android")}</span>
              <span>{t("googlePlay")}</span>
            </a>
          </div>
        </div>
      ) : null}

      {activePanel === "support" ? (
        <div className="desktop-float-panel desktop-float-panel-support" onMouseLeave={() => setActivePanel(null)}>
          <div className="desktop-float-panel-title">{t("supportTitle")}</div>
          <p className="desktop-float-panel-copy">
            {t("supportDescription")}
          </p>
          <a href={`mailto:${supportEmail}`} className="desktop-float-panel-link">
            {supportEmail}
          </a>
          <Link href={helpHref} className="desktop-float-panel-link is-secondary">
            {t("openHelp")}
          </Link>
          <div className="desktop-float-panel-note">{t("supportHours")}</div>
        </div>
      ) : null}

      <div className="desktop-float-cart-tip" aria-hidden="true">
        <span>{summary.quantity} items</span>
        <span>{formatUsd(summary.total)}</span>
      </div>
    </aside>
  );
}
