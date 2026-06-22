import { AdminModal } from "@/components/admin/AdminModal";
import { AdminSaveForm } from "@/components/admin/AdminSaveForm";
import { AdminDataPageTable, type AdminDataTableRow } from "@/components/admin/modules/AdminDataPageTable";
import { StatusPill } from "@/components/ui/StatusPill";
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { updateSupportTicket } from "@/app/_admin/actions";
import { parseTicketIssueType } from "@/lib/account/ticket-records";
import { ticketCategoryLabel } from "@/types/ticket";

const ticketStatuses = ["open", "in_progress", "waiting_user", "resolved", "closed"];

export default async function AdminTicketsPage() {
  const t = await getTranslations("users.ticketsPage");
  const tickets = await prisma.supportTicket.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 120
  });
  const tableRows: AdminDataTableRow[] = tickets.map((ticket) => {
    const issue = parseTicketIssueType(ticket.issueType);
    const issueLabel = `${issue.subject} · ${ticketCategoryLabel(issue.category)} · ${issue.priority}`;

    return {
      id: String(ticket.id),
      actionHref: `#ticket-${ticket.id}`,
      actionLabel: t("table.reply"),
      cells: {
        orderTracking: (
          <div>
            <div className="font-bold text-slate-900">{ticket.orderOrTrackingNo}</div>
            <div className="text-xs text-slate-400">{ticket.ticketNo}</div>
          </div>
        ),
        user: ticket.user.email,
        issueType: issueLabel,
        problem: <div className="max-w-[380px] truncate">{ticket.problemDescription}</div>,
        status: <StatusPill status={ticket.status} />,
        createdAt: ticket.createdAt.toLocaleString()
      },
      searchValues: {
        orderTracking: `${ticket.orderOrTrackingNo} ${ticket.ticketNo}`,
        user: ticket.user.email,
        issueType: issueLabel,
        problem: ticket.problemDescription,
        status: ticket.status,
        createdAt: ticket.createdAt.toISOString()
      }
    };
  });

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="admin-kicker">{t("kicker")}</div>
          <h1 className="admin-page-title mt-1">{t("title")}</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
            {t("description")}
          </p>
        </div>
        <div className="text-sm font-semibold text-slate-500">{t("records", { count: tickets.length })}</div>
      </div>

      <AdminDataPageTable
        columns={[
          { key: "orderTracking", label: t("table.orderTracking") },
          { key: "user", label: t("table.user") },
          { key: "issueType", label: t("table.issueType") },
          { key: "problem", label: t("table.problem"), className: "min-w-[320px]" },
          { key: "status", label: t("table.status") },
          { key: "createdAt", label: t("table.createdAt") }
        ]}
        rows={tableRows}
        rowActionLabel={t("table.reply")}
        searchPlaceholder={t("search")}
      />

      {tickets.map((ticket) => (
        <AdminModal key={ticket.id} id={`ticket-${ticket.id}`} title={ticket.ticketNo} description={`${ticket.user.email} · ${ticketIssueLabel(ticket.issueType)}`}>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="admin-card p-4">
              <h3 className="font-black text-slate-900">Ticket details</h3>
              <dl className="mt-4 grid gap-3 text-sm">
                <Detail label="Order / Tracking No" value={ticket.orderOrTrackingNo} />
                <Detail label="Issue Type" value={ticketIssueLabel(ticket.issueType)} />
                <Detail label="Customer" value={ticket.user.email} />
                <Detail label="Created At" value={ticket.createdAt.toLocaleString()} />
                <Detail label="Problem Description" value={ticket.problemDescription} pre />
                <Detail label="Current Reply" value={ticket.adminReply || "-"} pre />
              </dl>
            </div>

            <AdminSaveForm action={updateSupportTicket} className="admin-card grid h-fit gap-3 p-4" submitLabel="Save reply">
              <input type="hidden" name="id" value={ticket.id} />
              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                Status
                <select name="status" defaultValue={ticket.status} className="admin-input">
                  {ticketStatuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                Reply to user
                <textarea name="adminReply" defaultValue={ticket.adminReply ?? ""} placeholder="Write a clear response for the customer." className="admin-input min-h-40" />
              </label>
            </AdminSaveForm>
          </div>
        </AdminModal>
      ))}
    </section>
  );
}

function Detail({ label, value, pre = false }: { label: string; value: string; pre?: boolean }) {
  return (
    <div>
      <dt className="font-bold text-slate-500">{label}</dt>
      <dd className={`mt-1 break-words text-slate-900 ${pre ? "whitespace-pre-wrap leading-6" : ""}`}>{value}</dd>
    </div>
  );
}

function ticketIssueLabel(issueType: string) {
  const issue = parseTicketIssueType(issueType);
  return `${issue.subject} · ${ticketCategoryLabel(issue.category)} · ${issue.priority}`;
}
