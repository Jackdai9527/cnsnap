import { AlertTriangle, Plus, ShieldBan, ShieldCheck, Trash2, UserPlus, Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSaveForm } from "@/components/admin/AdminSaveForm";
import { AdminDataPageTable, type AdminDataTableRow } from "@/components/admin/modules/AdminDataPageTable";
import { Can } from "@/components/admin/Can";
import { StatusPill } from "@/components/ui/StatusPill";
import { adminRoleValues } from "@/lib/auth/permissions";
import { money } from "@/lib/currency";
import { prisma } from "@/lib/db";
import { createUserAdmin, deleteUserAdmin, updateUserAdmin } from "../actions";

const userStatusOptions = ["active", "disabled", "blocked"] as const;

export default async function AdminUsersPage() {
  const t = await getTranslations("users");
  const users = await prisma.user.findMany({
    include: {
      orders: { select: { id: true } },
      packages: { select: { id: true } },
      payments: { select: { id: true } },
      addresses: { select: { id: true } },
      walletTransactions: { orderBy: { createdAt: "desc" }, take: 5 }
    },
    orderBy: [{ createdAt: "desc" }]
  });

  const activeUsers = users.filter((user) => user.status === "active").length;
  const blockedUsers = users.filter((user) => user.status === "blocked" || user.status === "disabled").length;
  const customerUsers = users.filter((user) => user.role === "user").length;
  const totalWallet = users.reduce((sum, user) => sum + Number(user.walletBalance), 0);

  const tableRows: AdminDataTableRow[] = users.map((user) => ({
    id: String(user.id),
    actionHref: `#user-${user.id}`,
    actionLabel: t("table.manage"),
    cells: {
      user: (
        <div className="space-y-1">
          <div className="font-bold text-slate-900">{user.email}</div>
          <div className="text-xs text-slate-500">{user.name || t("table.noName")}</div>
        </div>
      ),
      role: <StatusPill status={user.role} />,
      status: <StatusPill status={user.status} />,
      orders: user.orders.length,
      packages: user.packages.length,
      wallet: <span className="font-bold text-slate-900">{money(Number(user.walletBalance))}</span>,
      locale: `${user.locale} / ${user.currency}`,
      joined: user.createdAt.toLocaleDateString()
    },
    searchValues: {
      user: `${user.email} ${user.name ?? ""} ${user.referralCode}`,
      role: user.role,
      status: user.status,
      orders: String(user.orders.length),
      packages: String(user.packages.length),
      wallet: user.walletBalance.toString(),
      locale: `${user.locale} ${user.currency}`,
      joined: user.createdAt.toISOString()
    }
  }));

  return (
    <section className="space-y-5">
      <AdminPageHeader
        title={t("page.title")}
        description={t("page.description")}
        action={(
          <Can permission="admins.manage">
            <a
              href="#create-user"
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              <Plus size={16} />
              {t("page.newUser")}
            </a>
          </Can>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<UserPlus size={18} />}
          label={t("summary.totalUsers")}
          value={String(users.length)}
          note={t("summary.totalUsersNote", { count: customerUsers })}
          tone="sky"
        />
        <SummaryCard
          icon={<ShieldCheck size={18} />}
          label={t("summary.activeUsers")}
          value={String(activeUsers)}
          note={t("summary.activeUsersNote")}
          tone="emerald"
        />
        <SummaryCard
          icon={<ShieldBan size={18} />}
          label={t("summary.blockedUsers")}
          value={String(blockedUsers)}
          note={t("summary.blockedUsersNote")}
          tone="rose"
        />
        <SummaryCard
          icon={<Wallet size={18} />}
          label={t("summary.walletTotal")}
          value={money(totalWallet)}
          note={t("summary.walletTotalNote")}
          tone="amber"
        />
      </div>

      <AdminDataPageTable
        columns={[
          { key: "user", label: t("table.user") },
          { key: "role", label: t("table.role") },
          { key: "status", label: t("table.status") },
          { key: "orders", label: t("table.orders") },
          { key: "packages", label: t("table.packages") },
          { key: "wallet", label: t("table.wallet") },
          { key: "locale", label: t("table.locale") },
          { key: "joined", label: t("table.joined") }
        ]}
        rows={tableRows}
        searchPlaceholder={t("page.search")}
      />

      <Can permission="admins.manage">
        <AdminModal
          id="create-user"
          title={t("createModal.title")}
          description={t("createModal.description")}
          widthClass="max-w-3xl"
        >
          <AdminSaveForm action={createUserAdmin} permission="admins.manage" className="grid gap-4" submitLabel={t("createModal.submit")}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                {t("createModal.fields.name")}
                <input name="name" className="admin-input" minLength={2} required />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                {t("createModal.fields.email")}
                <input name="email" type="email" className="admin-input" required />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                {t("createModal.fields.password")}
                <input name="password" type="password" minLength={8} className="admin-input" required />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                {t("createModal.fields.role")}
                <select name="role" defaultValue="user" className="admin-input">
                  <option value="user">user</option>
                  {adminRoleValues.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                {t("createModal.fields.status")}
                <select name="status" defaultValue="active" className="admin-input">
                  {userStatusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                {t("createModal.fields.locale")}
                <input name="locale" defaultValue="en" className="admin-input" />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                {t("createModal.fields.currency")}
                <input name="currency" defaultValue="USD" className="admin-input" />
              </label>
            </div>
          </AdminSaveForm>
        </AdminModal>
      </Can>

      {users.map((user) => {
        const canDelete = user.role === "user"
          && user.orders.length === 0
          && user.packages.length === 0
          && user.payments.length === 0
          && user.addresses.length === 0
          && user.walletTransactions.length === 0;

        return (
          <AdminModal
            key={user.id}
            id={`user-${user.id}`}
            title={user.email}
            description={t("detailModal.description", {
              orders: user.orders.length,
              packages: user.packages.length,
              wallet: money(Number(user.walletBalance))
            })}
            widthClass="max-w-6xl"
          >
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-5">
                <AdminSaveForm action={updateUserAdmin} permission="admins.manage" className="admin-card grid gap-4 p-4" submitLabel={t("detailModal.submit")}>
                  <input type="hidden" name="id" value={user.id} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-1 text-sm font-semibold text-slate-600 md:col-span-2">
                      {t("detailModal.fields.name")}
                      <input name="name" defaultValue={user.name ?? ""} className="admin-input" />
                    </label>
                    <label className="grid gap-1 text-sm font-semibold text-slate-600">
                      {t("detailModal.fields.role")}
                      <select name="role" defaultValue={user.role} className="admin-input">
                        <option value="user">user</option>
                        {adminRoleValues.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm font-semibold text-slate-600">
                      {t("detailModal.fields.status")}
                      <select name="status" defaultValue={user.status} className="admin-input">
                        {userStatusOptions.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm font-semibold text-slate-600">
                      {t("detailModal.fields.locale")}
                      <input name="locale" defaultValue={user.locale} className="admin-input" />
                    </label>
                    <label className="grid gap-1 text-sm font-semibold text-slate-600">
                      {t("detailModal.fields.currency")}
                      <input name="currency" defaultValue={user.currency} className="admin-input" />
                    </label>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
                    {t("detailModal.statusWarning")}
                  </div>
                </AdminSaveForm>

                <Can permission="admins.manage">
                  <section className="admin-card space-y-4 p-4">
                    <div>
                      <h3 className="font-black text-slate-900">{t("detailModal.dangerZone.title")}</h3>
                      <p className="mt-1 text-sm text-slate-500">{t("detailModal.dangerZone.description")}</p>
                    </div>

                    <form action={deleteUserAdmin} className="grid gap-3">
                      <input type="hidden" name="id" value={user.id} />
                      <label className="grid gap-1 text-sm font-semibold text-slate-600">
                        {t("detailModal.dangerZone.confirmLabel", { email: user.email })}
                        <input
                          name="confirmation"
                          defaultValue=""
                          placeholder={user.email}
                          className="admin-input"
                          disabled={!canDelete}
                          required={canDelete}
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={!canDelete}
                        className="inline-flex w-fit items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                        {t("detailModal.dangerZone.delete")}
                      </button>
                      {!canDelete ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
                          {t("detailModal.dangerZone.blockedHint")}
                        </div>
                      ) : null}
                    </form>
                  </section>
                </Can>
              </div>

              <aside className="space-y-5">
                <section className="admin-card p-4">
                  <h3 className="font-black text-slate-900">{t("detailModal.summary.title")}</h3>
                  <dl className="mt-4 grid gap-3 text-sm">
                    <MetricRow label={t("detailModal.summary.email")} value={user.email} />
                    <MetricRow label={t("detailModal.summary.referralCode")} value={user.referralCode} />
                    <MetricRow label={t("detailModal.summary.status")} value={<StatusPill status={user.status} />} />
                    <MetricRow label={t("detailModal.summary.role")} value={<StatusPill status={user.role} />} />
                    <MetricRow label={t("detailModal.summary.wallet")} value={money(Number(user.walletBalance))} />
                    <MetricRow label={t("detailModal.summary.orders")} value={String(user.orders.length)} />
                    <MetricRow label={t("detailModal.summary.packages")} value={String(user.packages.length)} />
                    <MetricRow label={t("detailModal.summary.payments")} value={String(user.payments.length)} />
                    <MetricRow label={t("detailModal.summary.addresses")} value={String(user.addresses.length)} />
                    <MetricRow label={t("detailModal.summary.recentWalletActivity")} value={String(user.walletTransactions.length)} />
                    <MetricRow label={t("detailModal.summary.joined")} value={user.createdAt.toLocaleString()} />
                    <MetricRow label={t("detailModal.summary.updated")} value={user.updatedAt.toLocaleString()} />
                  </dl>
                </section>

                {(user.status === "blocked" || user.status === "disabled") ? (
                  <section className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-900">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 rounded-full bg-white p-2 text-rose-700">
                        <AlertTriangle size={16} />
                      </span>
                      <div>
                        <div className="font-black">{t("detailModal.restrictionCard.title")}</div>
                        <p className="mt-1">{t("detailModal.restrictionCard.description")}</p>
                      </div>
                    </div>
                  </section>
                ) : null}
              </aside>
            </div>
          </AdminModal>
        );
      })}
    </section>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  note,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  tone: "sky" | "emerald" | "rose" | "amber";
}) {
  const toneClass = {
    sky: "border-sky-200 bg-sky-50 text-sky-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700"
  }[tone];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-black text-slate-950">{value}</div>
        </div>
        <span className={`rounded-2xl border p-3 ${toneClass}`}>{icon}</span>
      </div>
      <p className="mt-3 text-sm text-slate-500">{note}</p>
    </section>
  );
}

function MetricRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="font-bold text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-900">{value}</dd>
    </div>
  );
}
