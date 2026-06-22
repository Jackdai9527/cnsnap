import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { AdminPermissionProvider } from "@/components/admin/Can";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { requireAdminPage } from "@/lib/admin-session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("common.header");
  const user = await requireAdminPage();

  return (
    <div className="admin-light-shell min-h-screen bg-[#f7f8fb] text-[#101828]">
      <AdminPermissionProvider role={user.role}>
        <Suspense fallback={null}>
          <AdminSidebar userRole={user.role} />
        </Suspense>
        <div className="lg:pl-[312px]">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
          <div className="flex min-h-[76px] items-center justify-between px-4 lg:px-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{t("operations")}</div>
              <div className="text-lg font-extrabold text-slate-950">{t("console")}</div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/orders" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#2563eb] hover:bg-[#eff6ff] hover:text-[#2563eb]">
                {t("orders")}
              </Link>
              <Link href="/" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#2563eb] hover:bg-[#eff6ff] hover:text-[#2563eb]">
                {t("viewSite")}
              </Link>
              <LogoutButton callbackUrl="/admin-login" logoutMode="admin" className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                {t("signOut")}
              </LogoutButton>
              <div className="grid size-10 place-items-center rounded-full bg-[#eff6ff] font-bold text-[#2563eb] ring-1 ring-[#dbeafe]">{t("avatarFallback")}</div>
            </div>
          </div>
        </header>
          <main className="px-4 py-6 lg:px-8">{children}</main>
        </div>
      </AdminPermissionProvider>
    </div>
  );
}
