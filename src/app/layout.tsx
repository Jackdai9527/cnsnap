import type { Metadata } from "next";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { CartToast } from "@/components/cart/CartToast";
import { CurrencyProvider } from "@/components/currency/CurrencyProvider";
import { DesktopFloatingBar } from "@/components/layout/DesktopFloatingBar";
import { FrontendFooter } from "@/components/layout/FrontendFooter";
import { MainContentFrame } from "@/components/layout/MainContentFrame";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/mobile/navigation/MobileBottomNav";
import { ThemeSync } from "@/components/layout/ThemeSync";
import { isBuildTimeRuntime } from "@/lib/build-runtime";
import { prisma } from "@/lib/db";
import { ensureExchangeRatesFresh, getExchangeRateSettings, getLatestExchangeRateSnapshot, startExchangeRateScheduler } from "@/lib/exchange-rates";
import { getFrontendI18nState } from "@/lib/i18n/frontend";
import { isSeoLocaleRuntime } from "@/lib/i18n/locale-config-store";
import { getMergedMessages } from "@/lib/i18n/messages";
import { resolveAdminLocale, resolveFrontendLocaleForSeoLocale } from "@/lib/i18n/runtime";
import { getCurrentUser, isUserActive } from "@/lib/session";
import { createMetadataFromIndexPolicy } from "@/modules/seo/lib/metadata";
import "ckeditor5/ckeditor5.css";
import "react-inner-image-zoom/lib/styles.min.css";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await createMetadataFromIndexPolicy("/", {
    title: "China Purchasing Agent for Taobao, 1688 and Weidian",
    description: "Buy from Chinese marketplaces with warehouse QC, parcel consolidation, and global shipping support."
  });
  return {
    ...seo.metadata,
    icons: {
      icon: "/brand/cnsnap-favicon.svg",
      shortcut: "/brand/cnsnap-favicon.svg",
      apple: "/brand/cnsnap-favicon.svg"
    }
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  startExchangeRateScheduler();
  const headerStore = await headers();
  const routeScope = headerStore.get("x-app-route-scope");
  const seoLocaleHeader = headerStore.get("x-app-seo-locale");
  const isAdminRoute = routeScope === "admin";

  if (isAdminRoute) {
    const adminLocale = await resolveAdminLocale();

    return (
      <html lang={adminLocale} suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap"
          />
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
        </head>
        <body suppressHydrationWarning>{children}</body>
      </html>
    );
  }

  const [exchangeSettings, latestRates, frontendI18nState] = await Promise.all([
    getExchangeRateSettings(),
    ensureExchangeRatesFresh().catch(() => null).then(() => getLatestExchangeRateSnapshot().catch(() => null)),
    getFrontendI18nState()
  ]);
  const resolvedLocale = await isSeoLocaleRuntime(seoLocaleHeader)
    ? (await resolveFrontendLocaleForSeoLocale(seoLocaleHeader)) ?? frontendI18nState.locale
    : frontendI18nState.locale;
  const publicLocale = await isSeoLocaleRuntime(seoLocaleHeader) ? seoLocaleHeader! : undefined;
  const currentUser = await getCurrentUser();
  const supportSettings = isBuildTimeRuntime()
    ? []
    : await prisma.setting.findMany({
        where: { key: { in: ["support_email", "smtp_from_email", "floating_app_qr_code_url", "floating_ios_download_url", "floating_android_download_url", "floating_discord_url"] } }
      });
  const messages = await getMergedMessages(resolvedLocale, ["frontend"]);
  const supportMap = new Map(supportSettings.map((setting) => [setting.key, setting.value]));
  const supportEmail = supportMap.get("support_email") || supportMap.get("smtp_from_email") || "support@cnsnap.com";
  const appQrCodeUrl = supportMap.get("floating_app_qr_code_url") || "";
  const iosDownloadUrl = supportMap.get("floating_ios_download_url") || "";
  const androidDownloadUrl = supportMap.get("floating_android_download_url") || "";
  const discordUrl = supportMap.get("floating_discord_url") || "https://discord.gg/t7xmAYwZhU";
  const defaultCurrency = exchangeSettings.defaultCurrency;
  const liveRates = (latestRates?.rates as Record<string, number> | undefined) ?? {};
  const rates = { ...exchangeSettings.fallbackRates, ...liveRates, CNY: 1 };
  const auth = currentUser && isUserActive(currentUser.status)
    ? {
        authenticated: true,
        email: currentUser.email
      }
    : {
        authenticated: false
      };

  return (
    <html lang={resolvedLocale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body suppressHydrationWarning>
        <NextIntlClientProvider locale={resolvedLocale} messages={messages}>
          <CurrencyProvider currencies={exchangeSettings.enabledCurrencies} defaultCurrency={defaultCurrency} rates={rates}>
            <ThemeSync />
            <div className="grain" />
            <SiteHeader
              currencies={exchangeSettings.enabledCurrencies}
              defaultCurrency={defaultCurrency}
              pageLanguage={resolvedLocale}
              publicLocale={publicLocale}
              translateLanguages={frontendI18nState.languages}
              auth={auth}
            />
            <DesktopFloatingBar
              publicLocale={publicLocale}
              supportEmail={supportEmail}
              appQrCodeUrl={appQrCodeUrl}
              iosDownloadUrl={iosDownloadUrl}
              androidDownloadUrl={androidDownloadUrl}
              discordUrl={discordUrl}
            />
            <CartToast />
            <MainContentFrame>{children}</MainContentFrame>
            <FrontendFooter locale={publicLocale || resolvedLocale} />
            <MobileBottomNav pageLanguage={resolvedLocale} auth={auth} />
          </CurrencyProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
