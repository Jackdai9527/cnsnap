# DESIGN.md

## Overview
- Product surface with dual behavior:
  - Desktop stays in the current storefront style.
  - Mobile shifts to an app-like shell with dedicated top and bottom navigation layers.

## Visual style
- Warm light neutrals with red as the primary action color.
- Soft card surfaces, rounded corners, and restrained shadows.
- Mobile should feel denser and more guided, not more decorative.

## Typography
- Display: `Sora`
- Body: `Manrope`
- Mobile body text should remain at or above 14px for dense sections and 16px for inputs where possible.

## Core layout rules
- Desktop layout patterns remain unchanged unless a bug requires adjustment.
- Mobile may reorganize sections into stacked cards, rails, and grouped action zones.
- Content order should remain semantically stable for SEO.
- Reusable mobile shell pieces:
  - sticky app-style header
  - horizontal nav rail / menu drawer
  - bottom tab bar
  - structured footer blocks that keep links crawlable

## Mobile Strategy
- There are two mobile strategies in this project:
  - `seo_content_parity`
  - `app_rebuild_allowed`

### SEO Pages
- Applies to:
  - `/<seoLocale>`
  - `/<seoLocale>/blog`
  - `/<seoLocale>/blog/[slug]`
  - `/<seoLocale>/help`
  - `/<seoLocale>/help/[slug]`
  - `/<seoLocale>/platforms/[slug]`
  - `/<seoLocale>/shipping-to/[country]`
  - `/<seoLocale>/campaign/[slug]`
  - `/<seoLocale>/estimation`
  - `/<seoLocale>/promotion`
  - `/<seoLocale>/diy-order`
  - `/<seoLocale>/forwarding`
- Rule:
  - Mobile content must stay consistent with desktop content.
  - Do not remove H1, body copy, FAQ, important internal links, or structured data.
  - Mobile may change layout, spacing, cards, rails, sticky behavior, tabs, and accordion treatment only.
  - Canonical, hreflang, and sitemap behavior must remain correct.

### noindex Business Pages
- Applies to:
  - `/search`
  - `/<locale>/search`
  - `/<locale>/product/buy`
  - `/cart`
  - `/checkout`
  - `/account`
  - `/account/*`
  - `/orders`
  - `/orders/*`
- Rule:
  - Mobile does not need to match desktop information structure.
  - Mobile may be fully rebuilt around app-like task flows.
  - Optimize for speed, one-hand use, sticky summaries, fixed action bars, dense cards, and complete loading/empty/error states.
  - Never break business logic.
  - These pages must remain noindex and stay out of sitemap/hreflang.
  - `/<locale>/product/buy` must remain `noindex,nofollow`, must not emit Product schema, and must not emit self-canonical behavior.

### Locale Rule
- Public Chinese SEO URL is `/zh`.
- Do not ship `/zh-CN` as a public SEO route.
- Message files may still use `zh-CN`.

## Component notes
- Search is the primary action and should stay prominent on mobile.
- Product cards on mobile should favor two-column browsing over oversized single-column tiles.
- Process and benefits sections should become compact stacked cards on small screens.
- Footer content should remain in DOM and visible, but can be regrouped into clearer mobile blocks.

## Motion
- Short, soft transitions only.
- No layout-jumping animations on mobile.
- Sticky and reveal behavior should support orientation and quick scanning.
