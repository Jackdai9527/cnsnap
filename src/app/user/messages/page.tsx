import Link from "next/link";
import { ArrowLeft, MessageSquarePlus } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { StatusPill } from "@/components/ui/StatusPill";
import { TicketCreateModal } from "@/components/user/TicketCreateModal";

export default async function UserMessagesPage() {
  const user = await getCurrentUser();
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: user?.id },
    orderBy: { createdAt: "desc" },
    take: 80
  });

  return (
    <section className="space-y-5">
      <div className="brand-surface rounded-[28px] p-6 md:p-7">
        <div className="label">Support desk</div>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-5xl font-black text-[#101828]">Ticket Center</h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#667085]">
              Submit order, parcel, payment, coupon, and warehouse issues. Our support team will reply in this center.
            </p>
          </div>
          <Link href="#ticket-create" className="btn-primary w-fit rounded-xl px-5 py-3">
            <MessageSquarePlus size={17} />
            Create
          </Link>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left">
            <thead className="bg-[#f8fafc] text-xs font-extrabold uppercase text-[#667085]">
              <tr>
                <th className="px-4 py-3">Order / Tracking No</th>
                <th className="px-4 py-3">Issue Type</th>
                <th className="px-4 py-3">Problem Description</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created At</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dfe7f1] text-sm">
              {tickets.length ? tickets.map((ticket) => (
                <tr key={ticket.id} className="align-top">
                  <td className="px-4 py-4">
                    <div className="font-extrabold text-[#101828]">{ticket.orderOrTrackingNo}</div>
                    <div className="mt-1 text-xs font-bold text-[#98a2b3]">{ticket.ticketNo}</div>
                  </td>
                  <td className="px-4 py-4 font-semibold text-[#667085]">{ticket.issueType}</td>
                  <td className="max-w-[360px] px-4 py-4">
                    <div className="line-clamp-2 font-semibold leading-6 text-[#667085]">{ticket.problemDescription}</div>
                    {ticket.adminReply ? <div className="mt-2 rounded-xl bg-[#eff6ff] px-3 py-2 text-xs font-bold text-[#2563eb]">Reply: {ticket.adminReply}</div> : null}
                  </td>
                  <td className="px-4 py-4"><StatusPill status={ticket.status} /></td>
                  <td className="px-4 py-4 font-semibold text-[#667085]">{ticket.createdAt.toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <Link href={`#ticket-${ticket.id}`} className="btn-secondary rounded-xl px-3 py-2 text-xs">View</Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm font-semibold text-[#667085]">
                    No tickets yet. Create a ticket when you need help with an order, payment, parcel, or warehouse issue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TicketCreateModal />
      {tickets.map((ticket) => (
        <section key={ticket.id} id={`ticket-${ticket.id}`} className="fixed inset-0 z-[100] hidden items-start justify-center overflow-y-auto bg-slate-950/45 px-4 py-8 backdrop-blur-sm target:flex">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
            <Link href="/user/messages" className="inline-flex items-center gap-2 text-sm font-bold text-[#667085] hover:text-[#2563eb]"><ArrowLeft size={16} /> Back</Link>
            <h2 className="mt-4 font-display text-3xl font-black text-[#101828]">{ticket.ticketNo}</h2>
            <div className="mt-4 grid gap-3">
              <Info label="Order / Tracking No" value={ticket.orderOrTrackingNo} />
              <Info label="Issue Type" value={ticket.issueType} />
              <Info label="Status" value={ticket.status} />
              <Info label="Created At" value={ticket.createdAt.toLocaleString()} />
              <Info label="Problem Description" value={ticket.problemDescription} pre />
              <Info label="Support Reply" value={ticket.adminReply || "No reply yet."} pre />
            </div>
          </div>
        </section>
      ))}
    </section>
  );
}

function Info({ label, value, pre = false }: { label: string; value: string; pre?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#dfe7f1] bg-[#f8fafc] p-4">
      <div className="text-xs font-extrabold uppercase text-[#98a2b3]">{label}</div>
      <div className={`mt-1 break-words font-semibold text-[#101828] ${pre ? "whitespace-pre-wrap leading-6" : ""}`}>{value}</div>
    </div>
  );
}
