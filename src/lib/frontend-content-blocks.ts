import { prisma } from "@/lib/db";
import { isBuildTimeRuntime } from "@/lib/build-runtime";
import { footerSectionSettings } from "@/lib/footer-settings";
import { getNamespaceMessages } from "@/lib/i18n/messages";
import { getEnabledFrontendLocaleConfigsRuntime } from "@/lib/i18n/locale-config-store";
import { getAppLocaleBySeoLocale, isSeoLocale, type AppLocale, type SeoLocale } from "../../config/i18n";
import { withSeoLocale } from "@/modules/seo/lib/locale-routing";

export const translationStatuses = ["missing", "draft", "translated", "needs_review", "published"] as const;
export type TranslationStatus = (typeof translationStatuses)[number];

const FOOTER_GROUP_KEY = "footer";
const DEFAULT_FALLBACK_LOCALE = "en";

type FooterBlockKey = (typeof footerSectionSettings)[number][0];

type FrontendContentBlockSnapshot = {
  blockKey: string;
  blockType: string;
  status: string;
  sortOrder: number;
  translations: Record<string, { content: string; translationStatus: TranslationStatus }>;
};

function normalizeTranslationStatus(value?: string | null): TranslationStatus {
  if (value && translationStatuses.includes(value as TranslationStatus)) {
    return value as TranslationStatus;
  }
  return "draft";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getNestedMessage(record: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, record);
}

function getMessageText(record: Record<string, unknown>, path: string, fallback: string) {
  const value = getNestedMessage(record, path);
  return typeof value === "string" ? value : fallback;
}

function normalizeHtmlForComparison(value?: string | null) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function isLegacyFooterCtaHtml(value?: string | null) {
  const normalized = normalizeHtmlForComparison(value).toLowerCase();
  return normalized.includes("<h2>cnsnap</h2>") &&
    normalized.includes("paste a taobao, tmall, 1688, jd, or weidian link.") &&
    normalized.includes("we purchase, inspect, store, and ship it globally.");
}

function getSeoFooterHref(locale: string, pathname: string) {
  if (!isSeoLocale(locale)) return pathname;
  return withSeoLocale(locale as SeoLocale, pathname);
}

function getUiFooterHref(locale: string, pathname: string) {
  if (pathname === "/help") {
    return getSeoFooterHref(locale, pathname);
  }

  if (pathname === "/diy-order") {
    return getSeoFooterHref(locale, pathname);
  }

  if (pathname.startsWith("/help/")) {
    const stripped = pathname.replace(/^\/help/, "");
    return getSeoFooterHref(locale, `/help${stripped}`);
  }

  return pathname;
}

async function buildLocalizedFooterFallback(locale: string) {
  const messageLocale = (getAppLocaleBySeoLocale(locale) ?? locale) as AppLocale;
  const frontendMessages = await getNamespaceMessages("frontend", messageLocale) as Record<string, unknown>;
  const helpRootHref = getSeoFooterHref(locale, "/help");
  const diyOrderHref = getSeoFooterHref(locale, "/diy-order");
  const footer = (
    getNestedMessage(frontendMessages, "common.header.footer") ??
    getNestedMessage(frontendMessages, "common.footer") ??
    {}
  ) as Record<string, unknown>;

  const columns = [
    {
      title: getMessageText(footer, "serviceTitle", "CUSTOMER SERVICE"),
      links: [
        [getMessageText(footer, "helpCenter", "Help Center"), helpRootHref],
        [getMessageText(footer, "contactUs", "Contact Us"), getUiFooterHref(locale, "/help/contact-us")],
        [getMessageText(footer, "expertService", "Expert Service"), getUiFooterHref(locale, "/help/about-us")],
        [getMessageText(footer, "counterfeitPolicy", "Counterfeit Item Policy"), getUiFooterHref(locale, "/help/counterfeit-item-policy")]
      ]
    },
    {
      title: getMessageText(footer, "guidanceTitle", "SHOPPING AGENT GUIDANCE"),
      links: [
        [getMessageText(footer, "tutorial", "Tutorial"), getUiFooterHref(locale, "/help/tutorial")],
        [getMessageText(footer, "serviceFees", "Service & Fees"), getUiFooterHref(locale, "/help/service-fees")],
        [getMessageText(footer, "orderStatus", "Order Status"), getUiFooterHref(locale, "/help/order-status")],
        [getMessageText(footer, "returnsRefunds", "Returns and Refunds"), getUiFooterHref(locale, "/help/returns-and-refunds")]
      ]
    },
    {
      title: getMessageText(footer, "paymentTitle", "PAYMENT"),
      links: [
        [getMessageText(footer, "topUp", "Top up"), getUiFooterHref(locale, "/help/top-up")],
        [getMessageText(footer, "wise", "Wise"), getUiFooterHref(locale, "/help/wechat-pay")],
        [getMessageText(footer, "creditCard", "International Credit Card"), getUiFooterHref(locale, "/help/international-credit-card")],
        [getMessageText(footer, "walletBalance", "Wallet Balance"), getUiFooterHref(locale, "/account/wallet")]
      ]
    },
    {
      title: getMessageText(footer, "deliveryTitle", "DELIVERY"),
      links: [
        [getMessageText(footer, "charges", "Charges"), getUiFooterHref(locale, "/help/charges")],
        [getMessageText(footer, "mailRestrictions", "Mail Restrictions"), getUiFooterHref(locale, "/help/mail-restrictions")],
        [getMessageText(footer, "customsTaxation", "Customs and Taxation"), getUiFooterHref(locale, "/help/customs-and-taxation")],
        [getMessageText(footer, "receiptInformation", "Receipt Information"), getUiFooterHref(locale, "/help/receipt-information")]
      ]
    },
    {
      title: getMessageText(footer, "afterSalesTitle", "AFTER SALES SERVICE"),
      links: [
        [getMessageText(footer, "storage", "Storage"), getUiFooterHref(locale, "/help/storage")],
        [getMessageText(footer, "inspectionInfo", "Inspection Information"), getUiFooterHref(locale, "/help/inspection-information")],
        [getMessageText(footer, "afterSalesPolicy", "After Sales Policy"), getUiFooterHref(locale, "/help/after-sales-policy")],
        [getMessageText(footer, "insurance", "Insurance"), getUiFooterHref(locale, "/help/insurance-and-compensation")]
      ]
    }
  ] as const;

  const footerColumnsHtml = columns
    .map((column) => {
      const links = column.links
        .map(([label, href]) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`)
        .join("");
      return `<div><h3>${escapeHtml(column.title)}</h3>${links}</div>`;
    })
    .join("\n");

  return {
    footer_feature_cards_html: ``,
    footer_cta_html: `<h2>${escapeHtml(getMessageText(footer, "ctaTitle", "How To Find Products"))}</h2><p>${escapeHtml(getMessageText(footer, "ctaDescription", "Use product links, keyword search, or image search to discover items from Taobao, 1688, Weidian, and other China marketplaces. If you want sourcing help or a second opinion, experienced CNSnap buyers are available in our Discord community."))}</p><a href="${escapeHtml(diyOrderHref)}">${escapeHtml(getMessageText(footer, "ctaAction", "Start sourcing"))}</a>`,
    footer_columns_html: footerColumnsHtml,
    footer_payment_html: `<div class="footer-company-info"><p>${escapeHtml(getMessageText(footer, "serviceHotline", "9/7 (09:00-18:00, BJ Time) Service Hotline (Non-Toll-Free): +852 60990980"))}</p><p>${escapeHtml(getMessageText(footer, "serviceEmail", "Service Email: care@cnsnap.com"))}</p><p>${escapeHtml(getMessageText(footer, "businessEmail", "Business Email: biz@cnsnap.com"))}</p><p>${escapeHtml(getMessageText(footer, "reportEmail", "Report Counterfeits Email: report-counterfeits@cnsnap.com"))}</p><p>${escapeHtml(getMessageText(footer, "companyName", "Company Name: MOOR SPOT TECH CO., LIMITED"))}</p><p>${escapeHtml(getMessageText(footer, "companyAddress", "Company Address: FLAT A 15/F GOLDFIELD IND BLDG 144-150 TAI LIN PAI RD"))}</p></div><div class="footer-payment-info"><h3>${escapeHtml(getMessageText(footer, "payment", "Payment"))}</h3><div class="footer-payment-icons"><img src="/payment-logos/card_visa.svg" alt="Visa"><img src="/payment-logos/card_mastercard.svg" alt="Mastercard"><img src="/payment-logos/card_american-express.svg" alt="American Express"><img src="/payment-logos/card_discover.svg" alt="Discover"><img src="/payment-logos/card_apple-pay.svg" alt="Apple Pay"><img src="/payment-logos/card_google-pay.svg" alt="Google Pay"></div><div class="footer-social-icons" aria-label="Social media links"><a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i class="fa fa-facebook" aria-hidden="true"></i></a><a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><i class="fa fa-youtube-play" aria-hidden="true"></i></a><a href="https://x.com/" target="_blank" rel="noopener noreferrer" aria-label="X"><i class="fa fa-x" aria-hidden="true"></i></a><a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i class="fa fa-instagram" aria-hidden="true"></i></a></div></div>`,
    footer_bottom_html: `<nav><a href="${escapeHtml(getUiFooterHref(locale, "/help/about-us"))}">${escapeHtml(getMessageText(footer, "aboutUs", "About Us"))}</a><a href="${escapeHtml(getUiFooterHref(locale, "/help/contact-us"))}">${escapeHtml(getMessageText(footer, "contactUs", "Contact Us"))}</a><a href="${escapeHtml(getUiFooterHref(locale, "/help/terms-of-service"))}">${escapeHtml(getMessageText(footer, "terms", "Terms of Service"))}</a><a href="${escapeHtml(getUiFooterHref(locale, "/help/privacy-policy"))}">${escapeHtml(getMessageText(footer, "privacy", "Privacy Policy"))}</a><a href="${escapeHtml(helpRootHref)}">${escapeHtml(getMessageText(footer, "helpCenter", "Help Center"))}</a></nav><p>${escapeHtml(getMessageText(footer, "copyright", "Copyright©2026 CNSnap All Rights Reserved"))}</p>`
  } as Record<FooterBlockKey, string>;
}

export async function ensureFooterContentBlocks() {
  if (isBuildTimeRuntime()) return;
  const settings = await prisma.setting.findMany({
    where: { key: { in: footerSectionSettings.map(([key]) => key) } }
  });
  const legacyMap = new Map(settings.map((setting) => [setting.key, setting.value]));

  for (const [index, [blockKey, defaultValue]] of footerSectionSettings.entries()) {
    const block = await prisma.frontendContentBlock.upsert({
      where: { blockKey },
      update: {
        blockType: "footer_html",
        groupKey: FOOTER_GROUP_KEY,
        status: "enabled",
        sortOrder: index + 1
      },
      create: {
        blockKey,
        blockType: "footer_html",
        groupKey: FOOTER_GROUP_KEY,
        status: "enabled",
        sortOrder: index + 1
      }
    });

    await prisma.frontendContentBlockDescription.upsert({
      where: {
        blockId_languageCode: {
          blockId: block.id,
          languageCode: DEFAULT_FALLBACK_LOCALE
        }
      },
      update: {},
      create: {
        blockId: block.id,
        languageCode: DEFAULT_FALLBACK_LOCALE,
        content: legacyMap.get(blockKey) ?? defaultValue,
        translationStatus: "published"
      }
    });
  }
}

export async function getFooterContentBlocks() {
  if (isBuildTimeRuntime()) {
    const fallback = await buildLocalizedFooterFallback(DEFAULT_FALLBACK_LOCALE);
    return footerSectionSettings.map(([blockKey], index) => ({
      blockKey,
      blockType: "footer_html",
      status: "enabled",
      sortOrder: index + 1,
      translations: {
        [DEFAULT_FALLBACK_LOCALE]: {
          content: fallback[blockKey as FooterBlockKey] || "",
          translationStatus: "published" as TranslationStatus
        }
      } as Record<string, { content: string; translationStatus: TranslationStatus }>
    }));
  }
  await ensureFooterContentBlocks();
  const blocks = await prisma.frontendContentBlock.findMany({
    where: { groupKey: FOOTER_GROUP_KEY },
    include: {
      descriptions: {
        orderBy: { languageCode: "asc" }
      }
    },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
  });

  return blocks.map((block) => ({
    blockKey: block.blockKey,
    blockType: block.blockType,
    status: block.status,
    sortOrder: block.sortOrder,
    translations: Object.fromEntries(
      block.descriptions.map((description) => [
        description.languageCode,
        {
          content: description.content || "",
          translationStatus: normalizeTranslationStatus(description.translationStatus)
        }
      ])
    )
  })) satisfies FrontendContentBlockSnapshot[];
}

export async function getFooterContentForLocale(locale: string, fallbackLocale = DEFAULT_FALLBACK_LOCALE) {
  const blocks = await getFooterContentBlocks();
  const localizedFallbackBlocks = await buildLocalizedFooterFallback(locale);
  return Object.fromEntries(
    blocks.map((block) => {
      const current = block.translations[locale];
      const fallback = block.translations[fallbackLocale];
      const localizedFallback = localizedFallbackBlocks[block.blockKey as FooterBlockKey] || "";
      const shouldUseLocalizedFallback = (
        locale !== fallbackLocale &&
        Boolean(localizedFallback) &&
        (
          !current?.content ||
          current.translationStatus === "missing" ||
          current.translationStatus === "draft" ||
          !block.translations[locale] ||
          Object.keys(block.translations).length === 1 ||
          normalizeHtmlForComparison(current.content) === normalizeHtmlForComparison(fallback?.content)
        )
      );

      const resolvedContent = shouldUseLocalizedFallback
        ? localizedFallback
        : current?.content || localizedFallback || fallback?.content || "";

      const shouldOverrideLegacyCta = block.blockKey === "footer_cta_html" && isLegacyFooterCtaHtml(resolvedContent);
      const finalContent = shouldOverrideLegacyCta ? localizedFallback : resolvedContent;

      const resolvedStatus = shouldUseLocalizedFallback
        ? "published"
        : current?.translationStatus || (localizedFallback ? "published" : fallback?.translationStatus) || "missing";

      return [
        block.blockKey,
        {
          content: finalContent,
          translationStatus: resolvedStatus,
          fallbackUsed: shouldUseLocalizedFallback || shouldOverrideLegacyCta || (!current?.content && Boolean(localizedFallback || fallback?.content))
        }
      ];
    })
  ) as Record<FooterBlockKey, { content: string; translationStatus: TranslationStatus; fallbackUsed: boolean }>;
}

export async function saveFooterContentBlocksFromFormData(formData: FormData) {
  await ensureFooterContentBlocks();

  const blocks = await prisma.frontendContentBlock.findMany({
    where: { blockKey: { in: footerSectionSettings.map(([key]) => key) } }
  });
  const blockIdMap = new Map(blocks.map((block) => [block.blockKey, block.id]));
  const enabledLocales = await getEnabledFrontendLocaleConfigsRuntime();

  for (const [blockKey] of footerSectionSettings) {
    const blockId = blockIdMap.get(blockKey);
    if (!blockId) continue;

    for (const locale of enabledLocales) {
      const rawContent = String(formData.get(`content:${blockKey}:${locale.locale}`) || "");
      const translationStatus = normalizeTranslationStatus(String(formData.get(`translationStatus:${blockKey}:${locale.locale}`) || "draft"));
      const trimmed = rawContent.trim();

      if (!trimmed) {
        await prisma.frontendContentBlockDescription.deleteMany({
          where: {
            blockId,
            languageCode: locale.locale
          }
        });
        continue;
      }

      await prisma.frontendContentBlockDescription.upsert({
        where: {
          blockId_languageCode: {
            blockId,
            languageCode: locale.locale
          }
        },
        update: {
          content: rawContent,
          translationStatus
        },
        create: {
          blockId,
          languageCode: locale.locale,
          content: rawContent,
          translationStatus
        }
      });
    }
  }
}
