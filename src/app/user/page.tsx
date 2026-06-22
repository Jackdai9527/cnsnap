import Link from "next/link";
import { Gift, Heart, Mail, MessageSquareText, PackageCheck, ShieldCheck, ShoppingBag, WalletCards, Clock3 } from "lucide-react";
import { prisma } from "@/lib/db";
import { money } from "@/lib/currency";
import { getCurrentUser } from "@/lib/session";

export default async function UserDashboardPage() {
  const user = await getCurrentUser();
  const [orders, packages, diyOrders, settings, authAccounts] = await Promise.all([
    prisma.order.findMany({ where: { userId: user?.id }, take: 5, orderBy: { createdAt: "desc" } }),
    prisma.package.findMany({ where: { userId: user?.id }, take: 5, orderBy: { createdAt: "desc" } }),
    prisma.diyOrder.findMany({ where: { userId: user?.id }, take: 5, orderBy: { createdAt: "desc" } }),
    prisma.setting.findMany({ where: { key: { in: ["support_email", "smtp_from_email", "auth_email_enabled"] } } }),
    prisma.authAccount.findMany({ where: { userId: user?.id }, select: { provider: true } })
  ]);
  const settingMap = new Map(settings.map((setting) => [setting.key, setting.value]));
  const supportEmail = settingMap.get("support_email") || settingMap.get("smtp_from_email") || "support@cnsnap.com";
  const securityState = user?.passwordHash ? "Password enabled" : authAccounts.length ? `${authAccounts[0].provider} login` : "Set password";

  return (
    <div className="space-y-6">
      <div className="brand-surface rounded-[28px] p-6 md:p-7">
        <div className="label">Account workspace</div>
        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-4xl font-black text-[#101828] md:text-5xl">Welcome back, {user?.name || user?.email}</h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#667085]">
              Track orders, tickets, saved products, coupons, wallet balance, and account security from one place.
            </p>
          </div>
          <a href={`mailto:${supportEmail}`} className="btn-secondary w-fit rounded-xl px-4 py-2">
            <Mail size={16} />
            {supportEmail}
          </a>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Tile icon={<WalletCards />} label="Wallet balance" value={money(Number(user?.walletBalance ?? 0))} href="/user/wallet" />
        <Tile icon={<ShoppingBag />} label="Orders" value={orders.length} href="/user/orders" />
        <Tile icon={<PackageCheck />} label="Packages" value={packages.length} href="/user/packages" />
        <Tile icon={<ShieldCheck />} label="Security" value={securityState} href="/user/security" />
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <ActionCard icon={<MessageSquareText />} title="Ticket Center" description="Submit issues and view support replies for orders, parcels, payments, and coupons." href="/user/messages" action="Open tickets" />
        <ActionCard icon={<Heart />} title="Favorite products" description="Keep products you want to compare or buy later." href="/user/favorites" action="Open saved" />
        <ActionCard icon={<Clock3 />} title="Browsing history" description="Resume products you viewed from search or pasted links." href="/user/history" action="Continue browsing" />
        <ActionCard icon={<Gift />} title="Coupons" description="Activity coupons issued by the operations team will appear here." href="/user/coupons" action="View coupons" />
        <ActionCard icon={<Mail />} title="Customer service email" description={`Need help with payment, parcel, or product risk? Contact ${supportEmail}.`} href={`mailto:${supportEmail}`} action="Email support" external />
        <ActionCard icon={<ShieldCheck />} title="Account security" description="Update password, email address, and verification settings." href="/user/security" action="Manage settings" />
      </section>

      <section className="brand-surface rounded-[24px] p-5">
        <div className="label">Referral link</div>
        <div className="mt-2 break-all rounded-2xl border border-[#dfe7f1] bg-white px-4 py-3 font-mono text-sm text-[#101828]">http://localhost:3000/register?ref={user?.referralCode}</div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <List title="Recent orders" href="/user/orders" items={orders.map((order) => `${order.orderNo} · ${order.orderStatus} · ${money(Number(order.totalUsd))}`)} />
        <List title="DIY requests" href="/user/diy-orders" items={diyOrders.map((order) => `${order.productName ?? order.productUrl} · ${order.status}`)} />
      </section>
    </div>
  );
}

function Tile({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string | number; href: string }) {
  return (
    <Link href={href} className="panel p-5 transition hover:-translate-y-0.5 hover:border-[#2563eb] hover:shadow-[0_18px_42px_rgba(37,99,235,0.12)]">
      <div className="text-[#2563eb]">{icon}</div>
      <div className="label mt-4">{label}</div>
      <div className="mt-1 truncate font-display text-3xl font-black text-[#101828]">{value}</div>
    </Link>
  );
}

function ActionCard({ icon, title, description, href, action, external = false }: { icon: React.ReactNode; title: string; description: string; href: string; action: string; external?: boolean }) {
  const className = "panel flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:border-[#2563eb] hover:shadow-[0_18px_42px_rgba(37,99,235,0.12)]";
  const content = (
    <>
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#eff6ff] text-[#2563eb]">{icon}</div>
        <div>
          <h2 className="font-display text-2xl font-black text-[#101828]">{title}</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#667085]">{description}</p>
        </div>
      </div>
      <span className="mt-5 w-fit rounded-xl bg-[#f8fafc] px-3 py-2 text-xs font-extrabold text-[#2563eb]">{action}</span>
    </>
  );

  if (external) {
    return <a href={href} className={className}>{content}</a>;
  }
  return <Link href={href} className={className}>{content}</Link>;
}

function List({ title, href, items }: { title: string; href: string; items: string[] }) {
  return (
    <div className="panel p-5">
      <Link href={href} className="font-display text-2xl font-black text-[#101828] hover:text-[#2563eb]">{title}</Link>
      <div className="mt-4 space-y-2">
        {items.length ? items.map((item, index) => <div key={`${title}-${index}-${item}`} className="border-b border-[#dfe7f1] pb-2 text-sm font-semibold text-[#667085]">{item}</div>) : <p className="text-sm font-semibold text-[#98a2b3]">No records yet.</p>}
      </div>
    </div>
  );
}
