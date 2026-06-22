"use client";

import Link from "next/link";
import { MapPin, PackageCheck, ReceiptText, Sparkles, Ticket, UserRound, WalletCards, CreditCard, UsersRound } from "lucide-react";
import { useTranslations } from "next-intl";

export function HeaderAccountDropdown() {
  const t = useTranslations("common.header.account");
  const accountLinks = [
    { label: t("orders"), href: "/account/orders", icon: ReceiptText, description: t("ordersDescription") },
    { label: t("packages"), href: "/account/packages", icon: PackageCheck, description: t("packagesDescription") },
    { label: t("wallet"), href: "/account/wallet", icon: WalletCards, description: t("walletDescription") },
    { label: t("recharge"), href: "/account/recharge", icon: CreditCard, description: t("rechargeDescription") },
    { label: t("addresses"), href: "/account/addresses", icon: MapPin, description: t("addressesDescription") },
    { label: t("diyOrders"), href: "/account/diy-orders", icon: Sparkles, description: t("diyOrdersDescription") },
    { label: t("affiliate"), href: "/account/affiliate", icon: UsersRound, description: t("affiliateDescription") },
    { label: t("tickets"), href: "/account/tickets", icon: Ticket, description: t("ticketsDescription") },
    { label: t("profile"), href: "/account/profile", icon: UserRound, description: t("profileDescription") }
  ];

  return (
    <div className="header-dropdown-group">
      <Link href="/account" className="cnsnap-login-btn" title={t("centerTitle")}>
        <UserRound size={16} />
        <span className="hidden sm:inline">{t("title")}</span>
      </Link>

      <div className="header-dropdown-panel header-account-panel" role="menu" aria-label={t("centerTitle")}>
        <div className="border-b border-[#eef2f6] px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-black text-[#101828]">
            <span className="grid size-8 place-items-center rounded-full bg-[#101828] text-white">
              <UserRound size={15} />
            </span>
            {t("centerTitle")}
          </div>
          <p className="mt-1 text-xs font-semibold text-[#667085]">{t("centerDescription")}</p>
        </div>

        <div className="grid gap-1 p-2">
          {accountLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="group grid grid-cols-[34px_minmax(0,1fr)] gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-[#f8fafc]" role="menuitem">
                <span className="grid size-8 place-items-center rounded-xl border border-[#eef2f6] bg-white text-[#667085] transition group-hover:border-[#ffd7df] group-hover:bg-[#fff3f5] group-hover:text-[#d9142f]">
                  <Icon size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-black text-[#101828]">{item.label}</span>
                  <span className="mt-0.5 block line-clamp-1 text-xs font-semibold text-[#667085]">{item.description}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
