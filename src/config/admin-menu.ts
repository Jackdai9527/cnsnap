import type { ComponentType } from "react";
import {
  Database,
  Globe2,
  FileText,
  Headphones,
  LayoutDashboard,
  Megaphone,
  PackageOpen,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UsersRound,
  WalletCards
} from "lucide-react";
import { hasPermission } from "@/lib/auth/permissions";

export type AdminMenuChild = {
  key: string;
  label: string;
  path: string;
  permission?: string;
};

export type AdminMenuItem = {
  key: string;
  label: string;
  path?: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  permission?: string;
  children?: AdminMenuChild[];
};

export const adminMenu: AdminMenuItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
    permission: "dashboard.view"
  },
  {
    key: "orderCenter",
    label: "Order Center",
    icon: ShoppingCart,
    permission: "orders.view",
    children: [
      { key: "orders", label: "Orders", path: "/admin/orders", permission: "orders.view" },
      { key: "diyOrders", label: "DIY Orders", path: "/admin/diy-orders", permission: "diy_orders.view" },
      { key: "orderLogs", label: "Order Logs", path: "/admin/order-logs", permission: "order_logs.view" }
    ]
  },
  {
    key: "packageCenter",
    label: "Package Center",
    icon: PackageOpen,
    permission: "packages.view",
    children: [
      { key: "packages", label: "Packages", path: "/admin/packages", permission: "packages.view" },
      { key: "warehouseInbound", label: "Warehouse Inbound", path: "/admin/warehouse/inbound", permission: "warehouse.view" },
      { key: "shippingRecords", label: "Shipping Records", path: "/admin/packages/shipping-records", permission: "shipping_records.view" }
    ]
  },
  {
    key: "productCenter",
    label: "Product Center",
    icon: Database,
    permission: "products.view",
    children: [
      { key: "storefrontLibrary", label: "Storefront Library", path: "/admin/products/library", permission: "products.view" },
      { key: "importProducts", label: "Import Products", path: "/admin/products/import", permission: "products.view" },
      { key: "productCache", label: "Product Cache", path: "/admin/products/cache", permission: "products.view" },
      { key: "productCategories", label: "Product Categories", path: "/admin/products/categories", permission: "product_categories.manage" },
      { key: "valueAddedServices", label: "Value-added Services", path: "/admin/products/value-added-services", permission: "value_added_services.manage" },
      { key: "oneboundApiLogs", label: "OneBound API Logs", path: "/admin/products/api-logs", permission: "api_logs.view" }
    ]
  },
  {
    key: "userCenter",
    label: "User Center",
    icon: UsersRound,
    permission: "users.view",
    children: [
      { key: "users", label: "Users", path: "/admin/users", permission: "users.view" },
      { key: "userAddresses", label: "User Addresses", path: "/admin/users/addresses", permission: "user_addresses.view" },
      { key: "userTags", label: "User Tags", path: "/admin/users/tags", permission: "user_tags.manage" }
    ]
  },
  {
    key: "financeCenter",
    label: "Finance Center",
    icon: WalletCards,
    permission: "finance.view",
    children: [
      { key: "payments", label: "Payments", path: "/admin/finance/payments", permission: "payments.view" },
      { key: "walletTransactions", label: "Wallet Transactions", path: "/admin/finance/wallet-transactions", permission: "wallet_transactions.view" },
      { key: "rechargeRecords", label: "Recharge Records", path: "/admin/finance/recharges", permission: "recharges.view" },
      { key: "refundRecords", label: "Refund Records", path: "/admin/finance/refunds", permission: "refunds.view" },
      { key: "exchangeRate", label: "Exchange Rate", path: "/admin/finance/exchange-rate", permission: "exchange_rate.manage" },
      { key: "serviceFeeSettings", label: "Service Fee Settings", path: "/admin/finance/service-fees", permission: "service_fee.manage" }
    ]
  },
  {
    key: "shippingCenter",
    label: "Shipping Center",
    icon: Truck,
    permission: "shipping.view",
    children: [
      { key: "shippingChannels", label: "Shipping Channels", path: "/admin/shipping/channels", permission: "shipping_channels.manage" },
      { key: "shippingCountries", label: "Shipping Countries", path: "/admin/shipping/countries", permission: "shipping_countries.manage" },
      { key: "shippingRateRules", label: "Shipping Rate Rules", path: "/admin/shipping/rate-rules", permission: "shipping_rates.manage" },
      { key: "shippingRestrictionRules", label: "Shipping Restriction Rules", path: "/admin/shipping/restrictions", permission: "shipping_restrictions.manage" },
      { key: "shippingCalculator", label: "Shipping Calculator", path: "/admin/shipping/calculator", permission: "shipping_calculator.view" }
    ]
  },
  {
    key: "marketingCenter",
    label: "Marketing Center",
    icon: Megaphone,
    permission: "marketing.view",
    children: [
      { key: "affiliateOverview", label: "Affiliate Overview", path: "/admin/marketing/affiliate", permission: "affiliate.view" },
      { key: "affiliateUsers", label: "Affiliate Users", path: "/admin/marketing/affiliate-users", permission: "affiliate_users.view" },
      { key: "commissionRecords", label: "Commission Records", path: "/admin/marketing/commissions", permission: "commissions.view" },
      { key: "affiliateSettings", label: "Affiliate Settings", path: "/admin/marketing/affiliate-settings", permission: "affiliate.manage" }
    ]
  },
  {
    key: "seoCenter",
    label: "SEO Center",
    icon: Globe2,
    permission: "seo.manage",
    children: [
      { key: "seoDashboard", label: "Dashboard", path: "/admin/seo", permission: "seo.manage" },
      { key: "pageSeo", label: "Page SEO", path: "/admin/seo/pages", permission: "seo.manage" },
      { key: "seoArticles", label: "SEO Articles", path: "/admin/seo/articles", permission: "seo.manage" },
      { key: "landingPages", label: "Landing Pages", path: "/admin/seo/landing-pages", permission: "seo.manage" },
      { key: "seoLanguages", label: "SEO Languages", path: "/admin/seo/languages", permission: "seo.manage" },
      { key: "redirects", label: "Redirects", path: "/admin/seo/redirects", permission: "seo.manage" },
      { key: "seoAudit", label: "SEO Audit", path: "/admin/seo/audit", permission: "seo.manage" },
      { key: "articleCategories", label: "Article Categories", path: "/admin/seo/article-categories", permission: "seo.manage" },
      { key: "articleTags", label: "Article Tags", path: "/admin/seo/article-tags", permission: "seo.manage" },
      { key: "seoSettings", label: "SEO Settings", path: "/admin/seo/settings", permission: "seo.manage" },
      { key: "sitemapRobots", label: "Sitemap & Robots", path: "/admin/seo/sitemap-robots", permission: "seo.manage" }
    ]
  },
  {
    key: "contentCenter",
    label: "Content Center",
    icon: FileText,
    permission: "content.view",
    children: [
      { key: "footerSection", label: "Footer Section", path: "/admin/footer", permission: "footer.manage" },
      { key: "mediaLibrary", label: "Media Library", path: "/admin/content/media-library", permission: "media_library.manage" },
      { key: "helpArticles", label: "Help Articles", path: "/admin/content/help-articles", permission: "help_articles.manage" },
      { key: "faq", label: "FAQ", path: "/admin/content/faq", permission: "faq.manage" },
      { key: "announcements", label: "Announcements", path: "/admin/content/announcements", permission: "announcements.manage" },
      { key: "emailTemplates", label: "Email Templates", path: "/admin/content/email-templates", permission: "email_templates.manage" }
    ]
  },
  {
    key: "supportCenter",
    label: "Support Center",
    icon: Headphones,
    permission: "support.view",
    children: [
      { key: "helpContent", label: "Help Content", path: "/admin/help", permission: "help_articles.manage" },
      { key: "tickets", label: "Tickets", path: "/admin/tickets", permission: "tickets.manage" }
    ]
  },
  {
    key: "systemSettings",
    label: "System Settings",
    icon: Settings,
    permission: "settings.manage",
    children: [
      { key: "generalSettings", label: "General Settings", path: "/admin/settings/general", permission: "settings.manage" },
      { key: "apiSettings", label: "API Settings", path: "/admin/settings/api", permission: "settings.manage" },
      { key: "smtpSettings", label: "SMTP Settings", path: "/admin/settings/smtp", permission: "settings.manage" },
      { key: "authProviders", label: "Auth Providers", path: "/admin/auth", permission: "settings.manage" },
      { key: "currencySettings", label: "Currency Settings", path: "/admin/settings/currencies", permission: "settings.manage" },
      { key: "adminUsers", label: "Admin Users", path: "/admin/settings/admin-users", permission: "admins.manage" },
      { key: "rolesPermissions", label: "Roles & Permissions", path: "/admin/settings/roles", permission: "roles.manage" }
    ]
  },
  {
    key: "riskSecurity",
    label: "Risk & Security",
    icon: ShieldCheck,
    permission: "risk.view",
    children: [
      { key: "riskUsers", label: "Risk Users", path: "/admin/users/risk", permission: "risk_users.view" },
      { key: "sensitiveKeywords", label: "Sensitive Keywords", path: "/admin/settings/sensitive-keywords", permission: "sensitive_keywords.manage" },
      { key: "operationLogs", label: "Operation Logs", path: "/admin/settings/operation-logs", permission: "operation_logs.view" }
    ]
  }
];

export function canAccessAdminMenu(userRole: string | null | undefined, permission?: string) {
  return hasPermission(userRole, permission);
}

export { hasPermission };
