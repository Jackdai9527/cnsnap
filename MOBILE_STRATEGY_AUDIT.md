# Mobile Strategy Audit

This file records whether the current implementation follows the mobile page strategy.

Status values:
- `aligned`
- `partial`
- `needs_followup`

## SEO Content Parity Pages

| Route group | Strategy | Status | Evidence |
|---|---|---:|---|
| `/<seoLocale>` | `seo_content_parity` | aligned | [src/app/[locale]/page.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/app/%5Blocale%5D/page.tsx), [src/components/mobile/home/MobileHomePage.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/components/mobile/home/MobileHomePage.tsx), [src/components/layout/desktop/DesktopHomePage.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/components/layout/desktop/DesktopHomePage.tsx) |
| `/<seoLocale>/help` | `seo_content_parity` | aligned | [src/app/[locale]/help/page.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/app/%5Blocale%5D/help/page.tsx), [src/components/frontend/help/HelpCenterContent.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/components/frontend/help/HelpCenterContent.tsx) |
| `/<seoLocale>/help/[slug]` | `seo_content_parity` | aligned | [src/app/[locale]/help/[slug]/page.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/app/%5Blocale%5D/help/%5Bslug%5D/page.tsx) |
| `/<seoLocale>/estimation` | `seo_content_parity` | aligned | [src/app/[locale]/estimation/page.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/app/%5Blocale%5D/estimation/page.tsx), [src/components/pages/SeoStaticPages.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/components/pages/SeoStaticPages.tsx) |
| `/<seoLocale>/promotion` | `seo_content_parity` | aligned | [src/app/[locale]/promotion/page.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/app/%5Blocale%5D/promotion/page.tsx), [src/components/pages/SeoStaticPages.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/components/pages/SeoStaticPages.tsx) |
| `/<seoLocale>/diy-order` | `seo_content_parity` | aligned | [src/app/[locale]/diy-order/page.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/app/%5Blocale%5D/diy-order/page.tsx), [src/components/pages/SeoStaticPages.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/components/pages/SeoStaticPages.tsx) |
| `/<seoLocale>/forwarding` | `seo_content_parity` | aligned | [src/app/[locale]/forwarding/page.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/app/%5Blocale%5D/forwarding/page.tsx), [src/components/pages/SeoStaticPages.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/components/pages/SeoStaticPages.tsx) |
| `/<seoLocale>/blog*` | `seo_content_parity` | aligned | [src/app/[locale]/blog/page.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/app/%5Blocale%5D/blog/page.tsx), [src/app/[locale]/blog/[slug]/page.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/app/%5Blocale%5D/blog/%5Bslug%5D/page.tsx), 390px browser audit: H1 present, FAQ structure present, no horizontal overflow |
| `/<seoLocale>/platforms/[slug]` | `seo_content_parity` | aligned | [src/app/[locale]/platforms/[slug]/page.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/app/%5Blocale%5D/platforms/%5Bslug%5D/page.tsx), [src/modules/seo/components/SeoLandingPageView.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/modules/seo/components/SeoLandingPageView.tsx), 390px browser audit: H1 present, FAQ structure present, no horizontal overflow |
| `/<seoLocale>/shipping-to/[country]` | `seo_content_parity` | aligned | [src/app/[locale]/shipping-to/[country]/page.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/app/%5Blocale%5D/shipping-to/%5Bcountry%5D/page.tsx), [src/modules/seo/components/SeoLandingPageView.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/modules/seo/components/SeoLandingPageView.tsx), 390px browser audit: H1 present, FAQ structure present, no horizontal overflow |
| `/<seoLocale>/campaign/[slug]` | `seo_content_parity` | aligned | [src/app/[locale]/campaign/[slug]/page.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/app/%5Blocale%5D/campaign/%5Bslug%5D/page.tsx), [src/modules/seo/components/SeoLandingPageView.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/modules/seo/components/SeoLandingPageView.tsx), 390px browser audit: H1 present, FAQ structure present, no horizontal overflow |

## noindex App-Rebuild Pages

| Route group | Strategy | Status | Evidence |
|---|---|---:|---|
| `/search`, `/<locale>/search` | `app_rebuild_allowed` | aligned | [src/app/search/page.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/app/search/page.tsx) |
| `/<locale>/product/buy` | `app_rebuild_allowed` | aligned | [src/app/[locale]/product/buy/page.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/app/%5Blocale%5D/product/buy/page.tsx), [src/components/product/ProductDetailPdp.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/components/product/ProductDetailPdp.tsx) |
| `/cart`, `/<locale>/cart` | `app_rebuild_allowed` | aligned | [src/components/cart/CartClient.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/components/cart/CartClient.tsx) |
| `/checkout`, `/<locale>/checkout` | `app_rebuild_allowed` | aligned | [src/components/checkout/CheckoutClient.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/components/checkout/CheckoutClient.tsx) |
| `/account` | `app_rebuild_allowed` | aligned | [src/app/account/page.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/app/account/page.tsx) |
| `/account/orders`, `/account/orders/[id]` | `app_rebuild_allowed` | aligned | [src/components/account/orders/AccountOrdersTable.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/components/account/orders/AccountOrdersTable.tsx), [src/app/account/orders/[id]/page.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/app/account/orders/%5Bid%5D/page.tsx) |
| `/account/addresses` | `app_rebuild_allowed` | aligned | [src/components/account/addresses/AccountAddressesManager.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/components/account/addresses/AccountAddressesManager.tsx) |
| `/account/profile` | `app_rebuild_allowed` | aligned | [src/components/account/profile/ProfileContent.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/components/account/profile/ProfileContent.tsx) |
| `/account/wallet` | `app_rebuild_allowed` | aligned | [src/app/account/wallet/page.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/app/account/wallet/page.tsx) |
| `/account/packages`, `/account/packages/[id]` | `app_rebuild_allowed` | aligned | [src/components/account/packages/AccountPackagesTable.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/components/account/packages/AccountPackagesTable.tsx), [src/app/account/packages/[id]/page.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/app/account/packages/%5Bid%5D/page.tsx) |
| `/account/tickets`, `/account/tickets/[id]`, `/account/tickets/new` | `app_rebuild_allowed` | aligned | [src/components/account/tickets/AccountTicketsTable.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/components/account/tickets/AccountTicketsTable.tsx), [src/app/account/tickets/[id]/page.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/app/account/tickets/%5Bid%5D/page.tsx), [src/app/account/tickets/new/page.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/app/account/tickets/new/page.tsx) |
| `/account/recharge` | `app_rebuild_allowed` | aligned | [src/app/account/recharge/page.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/app/account/recharge/page.tsx) |
| `/account/diy-orders` | `app_rebuild_allowed` | aligned | [src/app/account/diy-orders/page.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/app/account/diy-orders/page.tsx) |
| `/account/affiliate` | `app_rebuild_allowed` | aligned | [src/app/account/affiliate/page.tsx](/Users/jack/Documents/Purchasing%20agent%20system/src/app/account/affiliate/page.tsx) |

## Route and SEO Evidence

- noindex classification is implemented in [src/modules/seo/lib/index-policy.ts](/Users/jack/Documents/Purchasing%20agent%20system/src/modules/seo/lib/index-policy.ts)
- metadata output is implemented in [src/modules/seo/lib/metadata.ts](/Users/jack/Documents/Purchasing%20agent%20system/src/modules/seo/lib/metadata.ts)
- `/zh-CN` is redirected to `/zh` in [src/proxy.ts](/Users/jack/Documents/Purchasing%20agent%20system/src/proxy.ts)

## Follow-up

No currently audited page groups remain in `partial`.
