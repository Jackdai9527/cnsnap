import Link from "next/link";
import { AlertCircle, ArrowRight, BadgeHelp, CreditCard, Gift, Heart, MapPin, MessageSquareText, Package, PackageCheck, Plus, Search, ShoppingBag, TicketPercent, UserRound, WalletCards } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AccountMetricCard } from "@/components/account/AccountMetricCard";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { AccountStatusBadge } from "@/components/account/AccountStatusBadge";
import { MobileAccountPreferencesCard } from "@/components/account/mobile/MobileAccountPreferencesCard";
import { MobileSectionShell } from "@/components/mobile/layout/MobileSectionShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { accountMenu } from "@/config/account-menu";
import { getAccountDashboard } from "@/lib/account/dashboard";
import { getAccountCouponsWorkspace, getAccountSupportWorkspace } from "@/lib/account/workspaces";

const quickLinks = [
  { key: "searchProducts", href: "/", icon: Search },
  { key: "submitDiyOrder", href: "/account/diy-orders/new", icon: Plus }
];

export default async function AccountDashboardPage() {
  const t = await getTranslations("account.dashboard");
  const sidebarT = await getTranslations("account.sidebar");
  const headerT = await getTranslations("account.header");
  const [dashboard, , supportWorkspace] = await Promise.all([
    getAccountDashboard(),
    getAccountCouponsWorkspace(),
    getAccountSupportWorkspace()
  ]);

  type MobileMenuItem = {
    href: string;
    iconKey:
      | "dashboard"
      | "orders"
      | "packages"
      | "wallet"
      | "billing"
      | "recharge"
      | "addresses"
      | "favorites"
      | "diyOrders"
      | "affiliate"
      | "coupons"
      | "ticketsCenter"
      | "support"
      | "profile"
      | "helpCenter";
    title: string;
    copy?: string;
  };

  const menuByKey = new Map(accountMenu.map((item) => [item.key, item]));
  const buildMenuItem = (key: string, copy?: string): MobileMenuItem | null => {
    const item = menuByKey.get(key);
    if (!item) return null;
    return {
      href: item.path,
      iconKey: item.key as
        | "dashboard"
        | "orders"
        | "packages"
        | "wallet"
        | "billing"
        | "recharge"
        | "addresses"
        | "favorites"
        | "diyOrders"
        | "affiliate"
        | "coupons"
        | "ticketsCenter"
        | "support"
        | "profile"
        | "helpCenter",
      title: sidebarT(`menu.${item.key}`),
      copy
    };
  };

  const compactMenu = (items: Array<MobileMenuItem | null>) =>
    items.filter((item): item is MobileMenuItem => item !== null);

  const settingsGroups = [
    {
      title: "Account",
      items: compactMenu([
        buildMenuItem("orders", "Track product order progress"),
        buildMenuItem("packages", "Parcels and shipping status"),
        buildMenuItem("wallet", "Balance and spending"),
        buildMenuItem("recharge", "Top up your balance"),
        buildMenuItem("billing", "Payments and records"),
        buildMenuItem("addresses", "Delivery addresses"),
        buildMenuItem("favorites", "Saved for later")
      ])
    },
    {
      title: "Services",
      items: compactMenu([
        buildMenuItem("diyOrders", "Manual sourcing requests"),
        buildMenuItem("coupons", "Offers and savings"),
        buildMenuItem("ticketsCenter", "Support history and replies"),
        buildMenuItem("affiliate", "Referral and commission"),
        buildMenuItem("helpCenter", "Policies, shipping, and payment help")
      ])
    }
  ];

  const preferenceItems = [
    {
      href: "/account/profile",
      iconKey: "profile" as const,
      title: sidebarT("menu.profile"),
      copy: "Identity and security"
    }
  ];

  return (
    <>
      <MobileSectionShell
        title={t("title", { name: dashboard.user.name })}
        description={t("description")}
        kicker={headerT("center")}
        className="mobile-account-page md:hidden"
        minimalHeader
        hideHeader
      >
        <section className="card-stack-section">
          <div className="mobile-account-app-hero">
            <div className="mobile-account-app-hero-top">
              <div className="mobile-account-app-user">
                <div className="mobile-account-app-avatar">{dashboard.user.name.slice(0, 1).toUpperCase()}</div>
                <div className="mobile-account-app-usercopy">
                  <div className="mobile-account-app-name">{dashboard.user.name}</div>
                  <div className="mobile-account-app-id">ID · {dashboard.user.referralCode}</div>
                </div>
              </div>
            </div>
            <div className="mobile-account-app-meta">
              <span className="mobile-account-app-meta-pill">{dashboard.user.language}</span>
              <span className="mobile-account-app-meta-pill">{dashboard.user.currency}</span>
              <span className="mobile-account-app-meta-pill">{supportWorkspace.summary.open} open tickets</span>
            </div>
            <div className="mobile-account-app-balance">
              <div className="mobile-account-app-balance-main">
                <strong>${dashboard.user.walletBalanceUsd.toFixed(2)}</strong>
                <span>{t("metrics.walletBalance")}</span>
              </div>
              <div className="mobile-account-app-balance-side">
                <strong>{dashboard.pendingPaymentOrders}</strong>
                <span>{t("metrics.pendingPaymentOrders")}</span>
              </div>
              <div className="mobile-account-app-balance-side">
                <strong>{dashboard.waitingShippingPaymentPackages}</strong>
                <span>{t("metrics.shippingFeeDue")}</span>
              </div>
            </div>
          </div>
        </section>

        {dashboard.pendingOrderAction || dashboard.pendingShippingAction ? (
          <section className="card-stack-section">
            <div className="mobile-account-list">
              {dashboard.pendingOrderAction ? (
                <article className="mobile-account-card p-4">
                  <div className="text-[11px] font-black uppercase tracking-[0.12em] text-amber-700">{t("alerts.order.eyebrow")}</div>
                  <div className="mt-2 text-base font-black text-slate-950">{t("alerts.order.title")}</div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    {t("alerts.order.description", {
                      orderNo: dashboard.pendingOrderAction.orderNo,
                      amount: dashboard.pendingOrderAction.amountUsd.toFixed(2)
                    })}
                  </p>
                  <Link href={dashboard.pendingOrderAction.href} className="mobile-orders-action is-primary mt-4">
                    {t("alerts.order.action")}
                  </Link>
                </article>
              ) : null}
              {dashboard.pendingShippingAction ? (
                <article className="mobile-account-card p-4">
                  <div className="text-[11px] font-black uppercase tracking-[0.12em] text-sky-700">{t("alerts.shipping.eyebrow")}</div>
                  <div className="mt-2 text-base font-black text-slate-950">{t("alerts.shipping.title")}</div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    {t("alerts.shipping.description", {
                      packageNo: dashboard.pendingShippingAction.packageNo,
                      amount: dashboard.pendingShippingAction.amountUsd.toFixed(2)
                    })}
                  </p>
                  <Link href={dashboard.pendingShippingAction.href} className="mobile-orders-action is-primary mt-4">
                    {t("alerts.shipping.action")}
                  </Link>
                </article>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="card-stack-section">
          <div className="mobile-account-action-rail">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="mobile-account-action-chip">
                  <Icon className="size-4" />
                  <span>{t(`quickActions.${item.key}`)}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {settingsGroups.map((group) => (
          <section key={group.title} className="card-stack-section">
            <div className="mobile-account-settings-group">
              <div className="mobile-account-settings-title">{group.title}</div>
              <div className="mobile-account-settings-list">
                {group.items.map((item) => {
                  return (
                    <Link key={item.href} href={item.href} className="mobile-account-settings-row">
                      <span className="mobile-account-settings-row-main">
                        <span className="mobile-account-settings-row-icon">
                          <MobileSectionIcon iconKey={item.iconKey} />
                        </span>
                        <span className="mobile-account-settings-row-copy">
                          <span className="mobile-account-settings-row-title">{item.title}</span>
                          {item.copy ? <span className="mobile-account-settings-row-text">{item.copy}</span> : null}
                        </span>
                      </span>
                      <ArrowRight className="size-4 text-slate-300" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        ))}

        <section className="card-stack-section">
          <MobileAccountPreferencesCard items={preferenceItems} />
        </section>
      </MobileSectionShell>

      <div className="hidden space-y-6 md:block">
        <AccountPageHeader
          title={t("title", { name: dashboard.user.name })}
          description={t("description")}
          action={<Button asChild><Link href="/">{t("searchProducts")}</Link></Button>}
        />

      {dashboard.pendingOrderAction || dashboard.pendingShippingAction ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {dashboard.pendingOrderAction ? (
            <Card className="border-amber-300 bg-[linear-gradient(135deg,#fff7ed_0%,#fef3c7_100%)] shadow-[0_18px_45px_rgba(146,64,14,0.08)]">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-2xl bg-white/80 text-amber-700">
                    <AlertCircle className="size-5" />
                  </span>
                  <div>
                    <div className="text-sm font-black uppercase tracking-[0.12em] text-amber-700">{t("alerts.order.eyebrow")}</div>
                    <h2 className="mt-1 text-lg font-black text-slate-950">{t("alerts.order.title")}</h2>
                    <p className="mt-1 text-sm font-semibold leading-6 text-amber-950/80">
                      {t("alerts.order.description", {
                        orderNo: dashboard.pendingOrderAction.orderNo,
                        amount: dashboard.pendingOrderAction.amountUsd.toFixed(2)
                      })}
                    </p>
                  </div>
                </div>
                <Button asChild className="h-11 rounded-full bg-amber-600 px-5 font-black text-white hover:bg-amber-700">
                  <Link href={dashboard.pendingOrderAction.href}>{t("alerts.order.action")}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {dashboard.pendingShippingAction ? (
            <Card className="border-sky-300 bg-[linear-gradient(135deg,#eff6ff_0%,#dbeafe_100%)] shadow-[0_18px_45px_rgba(37,99,235,0.08)]">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-2xl bg-white/80 text-sky-700">
                    <PackageCheck className="size-5" />
                  </span>
                  <div>
                    <div className="text-sm font-black uppercase tracking-[0.12em] text-sky-700">{t("alerts.shipping.eyebrow")}</div>
                    <h2 className="mt-1 text-lg font-black text-slate-950">{t("alerts.shipping.title")}</h2>
                    <p className="mt-1 text-sm font-semibold leading-6 text-sky-950/80">
                      {t("alerts.shipping.description", {
                        packageNo: dashboard.pendingShippingAction.packageNo,
                        amount: dashboard.pendingShippingAction.amountUsd.toFixed(2)
                      })}
                    </p>
                  </div>
                </div>
                <Button asChild className="h-11 rounded-full bg-sky-600 px-5 font-black text-white hover:bg-sky-700">
                  <Link href={dashboard.pendingShippingAction.href}>{t("alerts.shipping.action")}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AccountMetricCard title={t("metrics.walletBalance")} value={`$${dashboard.user.walletBalanceUsd.toFixed(2)}`} description={t("metrics.walletBalanceDescription")} icon={<WalletCards />} />
        <AccountMetricCard title={t("metrics.pendingPaymentOrders")} value={dashboard.pendingPaymentOrders} description={t("metrics.pendingPaymentOrdersDescription")} icon={<ShoppingBag />} />
        <AccountMetricCard title={t("metrics.shippingFeeDue")} value={dashboard.waitingShippingPaymentPackages} description={t("metrics.shippingFeeDueDescription")} icon={<CreditCard />} />
        <AccountMetricCard title={t("metrics.inTransitPackages")} value={dashboard.inTransitPackages} description={t("metrics.inTransitPackagesDescription")} icon={<PackageCheck />} />
      </section>

      <Card className="border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
        <CardHeader>
          <CardTitle>{t("quickActions.title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-sky-200 hover:bg-white hover:text-sky-700"
              >
                <span className="flex items-center gap-2">
                  <Icon className="size-4 text-pink-500" />
                  {t(`quickActions.${item.key}`)}
                </span>
                <ArrowRight className="size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-sky-500" />
              </Link>
            );
          })}
        </CardContent>
      </Card>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>{t("recentOrders.title")}</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link href="/account/orders">{t("recentOrders.viewAll")}</Link></Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("recentOrders.columns.order")}</TableHead>
                  <TableHead>{t("recentOrders.columns.status")}</TableHead>
                  <TableHead className="text-right">{t("recentOrders.columns.due")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.orders.slice(0, 4).map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link href={`/account/orders/${order.id}`} className="font-black text-slate-950 hover:text-sky-600">{order.orderNo}</Link>
                      <div className="text-xs font-medium text-slate-400">{order.createdAt}</div>
                    </TableCell>
                    <TableCell><AccountStatusBadge status={order.status} /></TableCell>
                    <TableCell className="text-right font-bold tabular-nums">${order.unpaidUsd.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>{t("recentPackages.title")}</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link href="/account/packages">{t("recentPackages.viewAll")}</Link></Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("recentPackages.columns.package")}</TableHead>
                  <TableHead>{t("recentPackages.columns.status")}</TableHead>
                  <TableHead className="text-right">{t("recentPackages.columns.shipping")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.packages.slice(0, 4).map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell>
                      <div className="font-black text-slate-950">{pkg.packageNo}</div>
                      <div className="text-xs font-medium text-slate-400">{pkg.orderNo}</div>
                    </TableCell>
                    <TableCell><AccountStatusBadge status={pkg.packageStatus} /></TableCell>
                    <TableCell className="text-right font-bold tabular-nums">${pkg.shippingFeeUsd.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
      </div>
    </>
  );
}

function MobileSectionIcon({
  iconKey
}: {
  iconKey:
    | "dashboard"
    | "orders"
    | "packages"
    | "wallet"
    | "billing"
    | "recharge"
    | "addresses"
    | "favorites"
    | "diyOrders"
    | "affiliate"
    | "coupons"
    | "ticketsCenter"
    | "support"
    | "profile"
    | "helpCenter";
}) {
  const iconMap = {
    dashboard: ShoppingBag,
    orders: ShoppingBag,
    packages: Package,
    wallet: WalletCards,
    billing: CreditCard,
    recharge: CreditCard,
    addresses: MapPin,
    favorites: Heart,
    diyOrders: Search,
    affiliate: Gift,
    coupons: TicketPercent,
    ticketsCenter: MessageSquareText,
    support: BadgeHelp,
    profile: UserRound,
    helpCenter: BadgeHelp
  } as const;
  const Icon = iconMap[iconKey];
  return <Icon className="size-4" />;
}
