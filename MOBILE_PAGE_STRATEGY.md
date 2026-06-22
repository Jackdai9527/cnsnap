# Mobile Page Strategy

This file is the source of truth for how mobile pages should be designed in this project.

## Rule Summary

There are only two valid mobile strategies:

1. `seo_content_parity`
2. `app_rebuild_allowed`

Desktop remains unchanged unless there is a bug.

## `seo_content_parity`

Use this strategy for pages that participate in SEO.

Mobile rules:
- Keep the same content as desktop.
- Do not remove H1, body copy, FAQ, important internal links, or structured data.
- Do not reduce SEO text depth.
- Only change layout, spacing, cards, tabs, accordions, sticky behavior, and visual grouping.

SEO rules:
- Keep canonical correct.
- Keep hreflang correct.
- Keep sitemap inclusion correct.

### Pages
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

## `app_rebuild_allowed`

Use this strategy for noindex business pages.

Mobile rules:
- Mobile may differ significantly from desktop information structure.
- Optimize for task completion, one-hand use, dense cards, fixed action bars, bottom sheets, sticky summaries, and complete loading/empty/error states.
- Do not break business logic.

SEO rules:
- Must remain noindex.
- Must not enter sitemap.
- Must not emit hreflang.

Special case:
- `/<locale>/product/buy` must remain `noindex,nofollow`.
- `/<locale>/product/buy` must not emit Product schema.
- `/<locale>/product/buy` must not emit self-canonical behavior.

### Pages
- `/search`
- `/<locale>/search`
- `/cart`
- `/<locale>/cart`
- `/checkout`
- `/<locale>/checkout`
- `/<locale>/product/buy`
- `/account`
- `/account/*`
- `/orders`
- `/orders/*`

## Locale Rule

- Public Chinese SEO URL is `/zh`
- Do not ship `/zh-CN` as a public SEO route
- Translation files may still use `zh-CN`

## Implementation Notes

- Strategy helper: [src/lib/mobile-page-strategy.ts](/Users/jack/Documents/Purchasing%20agent%20system/src/lib/mobile-page-strategy.ts)
- SEO policy: [src/modules/seo/lib/index-policy.ts](/Users/jack/Documents/Purchasing%20agent%20system/src/modules/seo/lib/index-policy.ts)
- Metadata behavior: [src/modules/seo/lib/metadata.ts](/Users/jack/Documents/Purchasing%20agent%20system/src/modules/seo/lib/metadata.ts)
