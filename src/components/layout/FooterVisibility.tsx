"use client";

import { usePathname } from "next/navigation";
import { shouldHideFooterOnMobilePath } from "@/lib/mobile-footer-rules";

export function FooterVisibility({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/admin") ||
    pathname === "/checkout" ||
    pathname.startsWith("/checkout") ||
    pathname.endsWith("/checkout")
  ) return null;

  if (shouldHideFooterOnMobilePath(pathname)) {
    return <div className="hidden md:block">{children}</div>;
  }

  return <>{children}</>;
}
