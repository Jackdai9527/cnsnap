import Link from "next/link";
import { getRequestSeoLocale } from "@/modules/seo/lib/request-locale";
import { withSeoLocale } from "@/modules/seo/lib/locale-routing";

type SeoLocaleLinkProps = Omit<React.ComponentProps<typeof Link>, "href"> & {
  href: string;
};

function isSeoEligiblePath(href: string) {
  return (
    href === "/"
    || href === "/blog"
    || href.startsWith("/blog/")
    || href === "/estimation"
    || href === "/promotion"
    || href === "/diy-order"
    || href === "/forwarding"
    || href === "/help"
    || href.startsWith("/help/")
    || href.startsWith("/platforms/")
    || href.startsWith("/shipping-to/")
    || href.startsWith("/campaign/")
  );
}

export async function SeoLocaleLink({ href, ...props }: SeoLocaleLinkProps) {
  const locale = await getRequestSeoLocale();
  const nextHref = locale && isSeoEligiblePath(href) ? withSeoLocale(locale, href) : href;
  return <Link href={nextHref} {...props} />;
}
