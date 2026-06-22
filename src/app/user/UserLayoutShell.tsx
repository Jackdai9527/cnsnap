"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";

const links = [
  ["Dashboard", "/user"],
  ["Orders", "/user/orders"],
  ["Packages", "/user/packages"],
  ["Addresses", "/user/addresses"],
  ["Wallet", "/user/wallet"],
  ["Ticket Center", "/user/messages"],
  ["Favorites", "/user/favorites"],
  ["Viewed products", "/user/history"],
  ["Coupons", "/user/coupons"],
  ["Account security", "/user/security"],
  ["DIY Orders", "/user/diy-orders"],
  ["Affiliate", "/user/affiliate"]
];

export function UserLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOrderCheckoutPage = /^\/user\/orders\/\d+/.test(pathname);

  if (isOrderCheckoutPage) {
    return <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>;
  }

  return (
    <div className="site-container grid gap-6 py-8 lg:grid-cols-[250px_1fr]">
      <aside className="brand-surface h-fit rounded-[26px] p-3">
        <div className="px-3 py-3 font-display text-2xl font-black">User center</div>
        <nav className="grid gap-1">
          {links.map(([label, href]) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} className={`rounded-2xl px-3 py-2 text-sm font-black transition ${active ? "bg-[#fff1f2] text-[#e60012]" : "text-[#667085] hover:bg-[#edf7ff] hover:text-[#0a83ff]"}`}>
                {label}
              </Link>
            );
          })}
          <SignOutButton />
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
