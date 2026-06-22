import { prisma } from "@/lib/db";

export const footerSectionSettings = [
  [
    "footer_feature_cards_html",
    ``,
    "Footer Feature Cards HTML",
    "HTML rendered in the three-card footer feature section."
  ],
  [
    "footer_cta_html",
    `<h2>How to find products</h2><p>Browse Taobao, 1688, Weidian, and other China marketplaces with product links, keyword search, or image search. If you need help finding the right item, experienced CNSnap buyers are available in our Discord community.</p><a href="/diy-order">Start sourcing</a>`,
    "Footer CTA HTML",
    "HTML rendered in the dark footer CTA section."
  ],
  [
    "footer_columns_html",
    `<div><h3>CUSTOMER SERVICE</h3><a href="/help">Help Center</a><a href="/help">Contact Us</a><a href="/help">Expert Service</a><a href="/help">Counterfeit Item Policy</a></div>
<div><h3>SHOPPING AGENT GUIDANCE</h3><a href="/help">Tutorial</a><a href="/help">Service & Fees</a><a href="/help">Order Status</a><a href="/help">Returns and Refunds</a></div>
<div><h3>PAYMENT</h3><a href="/help">Top up</a><a href="/help">Wise</a><a href="/help">International Credit Card</a><a href="/help">Wallet Balance</a></div>
<div><h3>DELIVERY</h3><a href="/help">Charges</a><a href="/help">Mail Restrictions</a><a href="/help">Customs and Taxation</a><a href="/help">Receipt Information</a></div>
<div><h3>AFTER SALES SERVICE</h3><a href="/help">Storage</a><a href="/help">Inspection Information</a><a href="/help">After Sales Policy</a><a href="/help">Insurance</a></div>`,
    "Footer Columns HTML",
    "HTML rendered as footer link columns."
  ],
  [
    "footer_payment_html",
    `<div class="footer-company-info"><p>9/7 (09:00-18:00, BJ Time) Service Hotline (Non-Toll-Free)：+852 60990980</p><p>Service Email: care@cnsnap.com</p><p>Business Email: biz@cnsnap.com</p><p>Report Counterfeits Email: report-counterfeits@cnsnap.com</p><p>Company Name：MOOR SPOT TECH CO., LIMITED</p><p>Company Address：FLAT A 15/F GOLDFIELD IND BLDG 144-150 TAI LIN PAI RD</p></div><div class="footer-payment-info"><h3>Payment</h3><div class="footer-payment-icons"><img src="/payment-logos/card_visa.svg" alt="Visa"><img src="/payment-logos/card_mastercard.svg" alt="Mastercard"><img src="/payment-logos/card_american-express.svg" alt="American Express"><img src="/payment-logos/card_discover.svg" alt="Discover"><img src="/payment-logos/card_apple-pay.svg" alt="Apple Pay"><img src="/payment-logos/card_google-pay.svg" alt="Google Pay"></div><div class="footer-social-icons" aria-label="Social media links"><a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i class="fa fa-facebook" aria-hidden="true"></i></a><a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><i class="fa fa-youtube-play" aria-hidden="true"></i></a><a href="https://x.com/" target="_blank" rel="noopener noreferrer" aria-label="X"><i class="fa fa-x" aria-hidden="true"></i></a><a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i class="fa fa-instagram" aria-hidden="true"></i></a></div></div>`,
    "Footer Payment HTML",
    "HTML rendered in the payment area. Default uses local payment logo files."
  ],
  [
    "footer_bottom_html",
    `<nav><a href="/help">About Us</a><a href="/help">Contact Us</a><a href="/help">Terms of Service</a><a href="/help">Privacy Policy</a><a href="/help">Help Center</a></nav><p>Copyright©2026 CNSnap All Rights Reserved</p>`,
    "Footer Bottom HTML",
    "HTML rendered at the bottom of the footer."
  ]
] as const;

export const footerSectionKeys = footerSectionSettings.map(([key]) => key);

export async function ensureFooterSectionSettings() {
  for (const [key, value, label, description] of footerSectionSettings) {
    await prisma.setting.upsert({
      where: { key },
      update: { label, description },
      create: { key, value, label, description }
    });
  }
}

export async function getFooterSections() {
  await ensureFooterSectionSettings();
  await syncFooterHelpArticleLinks();
  const settings = await prisma.setting.findMany({
    where: { key: { in: footerSectionKeys } }
  });
  const map = new Map(settings.map((setting) => [setting.key, setting.value]));
  return Object.fromEntries(footerSectionSettings.map(([key, value]) => [key, map.get(key) ?? value])) as Record<(typeof footerSectionKeys)[number], string>;
}

async function syncFooterHelpArticleLinks() {
  const articles = await prisma.helpArticle.findMany({
    where: { isPublished: true },
    orderBy: [{ category: "asc" }, { title: "asc" }]
  });
  const sortedArticles = sortHelpArticles(articles);
  if (!sortedArticles.length) return;

  const articleMap = new Map(sortedArticles.map((article) => [normalizeLinkLabel(article.title), article]));
  const columns = [
    {
      title: "CUSTOMER SERVICE",
      links: ["Help Center", "Contact Us", "About Us", "Counterfeit Item Policy"]
    },
    {
      title: "SHOPPING AGENT GUIDANCE",
      links: ["Tutorial", "Service & Fees", "Order Status", "Returns and Refunds"]
    },
    {
      title: "PAYMENT",
      links: ["Top Up", "Wechat Pay", "International Credit Card"]
    },
    {
      title: "DELIVERY",
      links: ["Mail Restrictions", "Customs and Taxation", "Receipt Information"]
    },
    {
      title: "AFTER SALES SERVICE",
      links: ["Storage", "Inspection Information", "Insurance and Compensation"]
    }
  ];

  const footerColumnsHtml = columns
    .map((column) => {
      const links = column.links
        .map((label) => buildArticleLink(label, articleMap))
        .filter(Boolean)
        .join("");
      return `<div><h3>${escapeHtml(column.title)}</h3>${links}</div>`;
    })
    .join("\n");
  const footerBottomHtml = `<nav>${["About Us", "Contact Us", "Terms of Service", "Privacy Policy", "Help Center"]
    .map((label) => buildArticleLink(label, articleMap))
    .filter(Boolean)
    .join("")}</nav><p>Copyright©2026 CNSnap All Rights Reserved</p>`;

  await prisma.setting.upsert({
    where: { key: "footer_columns_html" },
    update: { value: footerColumnsHtml },
    create: {
      key: "footer_columns_html",
      value: footerColumnsHtml,
      label: "Footer Columns HTML",
      description: "HTML rendered as footer link columns."
    }
  });
  await prisma.setting.upsert({
    where: { key: "footer_bottom_html" },
    update: { value: footerBottomHtml },
    create: {
      key: "footer_bottom_html",
      value: footerBottomHtml,
      label: "Footer Bottom HTML",
      description: "HTML rendered at the bottom of the footer."
    }
  });
}

function buildArticleLink(label: string, articleMap: Map<string, { slug: string; title: string }>) {
  if (label === "Help Center") {
    return `<a href="/help">Help Center</a>`;
  }
  const article = articleMap.get(normalizeLinkLabel(label)) ?? findArticleByAlias(label, articleMap);
  if (!article) return "";
  return `<a href="/help/${escapeAttribute(article.slug)}">${escapeHtml(label)}</a>`;
}

function findArticleByAlias(label: string, articleMap: Map<string, { slug: string; title: string }>) {
  const aliases: Record<string, string> = {
    "Service & Fees": "Service Fees",
    "Returns and Refunds": "Returns Refunds",
    "Insurance and Compensation": "Insurance Compensation",
    "Top Up": "Top up"
  };
  const alias = aliases[label];
  return alias ? articleMap.get(normalizeLinkLabel(alias)) : undefined;
}

function sortHelpArticles<T extends { sortOrder?: number | null; category: string; title: string }>(articles: T[]) {
  return [...articles].sort((left, right) => {
    const orderDiff = Number(left.sortOrder ?? 0) - Number(right.sortOrder ?? 0);
    if (orderDiff) return orderDiff;
    const categoryDiff = left.category.localeCompare(right.category);
    if (categoryDiff) return categoryDiff;
    return left.title.localeCompare(right.title);
  });
}

function normalizeLinkLabel(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}
