"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink, MessageSquareText } from "lucide-react";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { MobileSectionShell } from "@/components/mobile/layout/MobileSectionShell";
import { TicketConversation } from "@/components/account/tickets/TicketConversation";
import { TicketPriorityBadge } from "@/components/account/tickets/TicketPriorityBadge";
import { TicketReplyForm } from "@/components/account/tickets/TicketReplyForm";
import { TicketStatusBadge } from "@/components/account/tickets/TicketStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTicketDetail } from "@/hooks/account/useTicketDetail";
import { ticketCategoryLabel } from "@/types/ticket";

function orderHref(orderNo: string) {
  const id = orderNo.replace(/^CN/, "");
  return `/account/orders/${id}`;
}

export default function TicketDetailPage() {
  const t = useTranslations("account.tickets.detail");
  const params = useParams<{ id: string }>();
  const { data: ticket, isLoading } = useTicketDetail(params.id);

  if (isLoading) {
    return (
      <>
        <MobileSectionShell title={t("reply")} description={t("loading")} kicker={t("conversation")} className="mobile-ticket-detail-page md:hidden" minimalHeader showBackButton>
          <section className="card-stack-section">
            <div className="mobile-cart-empty">
              <h2>{t("reply")}</h2>
              <p>{t("loading")}</p>
            </div>
          </section>
        </MobileSectionShell>
        <div className="hidden md:block rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500">{t("loading")}</div>
      </>
    );
  }

  if (!ticket) {
    return (
      <>
        <MobileSectionShell title={t("notFoundTitle")} description={t("notFoundDescription")} kicker={t("category")} className="mobile-ticket-detail-page md:hidden" minimalHeader showBackButton>
          <section className="card-stack-section">
            <div className="mobile-cart-empty">
              <h2>{t("notFoundTitle")}</h2>
              <p>{t("notFoundDescription")}</p>
              <Link href="/account/tickets" className="cnsnap-home-mobile-more">{t("back")}</Link>
            </div>
          </section>
        </MobileSectionShell>
        <div className="hidden md:block rounded-3xl border border-slate-200 bg-white p-8">
          <h1 className="text-xl font-black text-slate-950">{t("notFoundTitle")}</h1>
          <p className="mt-2 text-sm text-slate-500">{t("notFoundDescription")}</p>
          <Button asChild className="mt-5"><Link href="/account/tickets">{t("back")}</Link></Button>
        </div>
      </>
    );
  }

  return (
    <>
      <MobileSectionShell title={ticket.ticketNo} description={ticket.subject} kicker={t("conversation")} className="mobile-ticket-detail-page md:hidden" minimalHeader showBackButton>
        <section className="card-stack-section">
          <div className="mobile-order-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <TicketStatusBadge status={ticket.status} />
              <TicketPriorityBadge priority={ticket.priority} />
            </div>
            <div className="mt-3 text-sm font-black text-slate-900">{ticket.subject}</div>
            <div className="mt-3 grid gap-2">
              <MobileTicketInfo label={t("category")} value={ticketCategoryLabel(ticket.category)} />
              <MobileTicketInfo label={t("created")} value={ticket.createdAt} />
              <MobileTicketInfo label={t("lastReply")} value={ticket.lastReplyAt ?? "-"} />
            </div>
          </div>
        </section>

        <section className="card-stack-section">
          <div className="mobile-order-card p-4">
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("relatedRecord")}</div>
            <div className="mobile-account-list">
              <MobileTicketInfo
                label={t("order")}
                value={ticket.relatedOrderNo ? (
                  <Link href={orderHref(ticket.relatedOrderNo)} className="inline-flex items-center gap-1 text-sky-700">
                    {ticket.relatedOrderNo}<ExternalLink className="size-3" />
                  </Link>
                ) : "-"}
              />
              <MobileTicketInfo
                label={t("package")}
                value={ticket.relatedPackageNo ? (
                  <Link href={`/account/packages/${ticket.relatedPackageNo}`} className="inline-flex items-center gap-1 text-sky-700">
                    {ticket.relatedPackageNo}<ExternalLink className="size-3" />
                  </Link>
                ) : "-"}
              />
            </div>
          </div>
        </section>

        <section className="card-stack-section">
          <div className="mobile-order-card p-4">
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("conversation")}</div>
            <TicketConversation messages={ticket.messages} />
          </div>
        </section>

        <section className="card-stack-section">
          <div className="mobile-order-card p-4">
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t("reply")}</div>
            <TicketReplyForm status={ticket.status} />
          </div>
        </section>

      </MobileSectionShell>

      <div className="hidden space-y-6 md:block">
        <AccountPageHeader
          title={ticket.ticketNo}
          description={ticket.subject}
          action={
            <Button asChild variant="outline">
              <Link href="/account/tickets"><ArrowLeft />{t("back")}</Link>
            </Button>
          }
        />

        <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card className="border-slate-200 bg-white/90">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <TicketStatusBadge status={ticket.status} />
              <TicketPriorityBadge priority={ticket.priority} />
            </div>
            <CardTitle className="flex items-start gap-3 text-2xl">
              <MessageSquareText className="mt-1 size-5 text-sky-500" />
              {ticket.subject}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Info label={t("category")} value={ticketCategoryLabel(ticket.category)} />
            <Info label={t("created")} value={ticket.createdAt} />
            <Info label={t("lastReply")} value={ticket.lastReplyAt ?? "-"} />
            <Info label={t("status")} value={<TicketStatusBadge status={ticket.status} />} />
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/90">
          <CardHeader><CardTitle>{t("relatedRecord")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Info
              label={t("order")}
              value={ticket.relatedOrderNo ? (
                <Link href={orderHref(ticket.relatedOrderNo)} className="inline-flex items-center gap-1 text-sky-700 hover:underline">
                  {ticket.relatedOrderNo}<ExternalLink className="size-3" />
                </Link>
              ) : "-"}
            />
            <Info
              label={t("package")}
              value={ticket.relatedPackageNo ? (
                <Link href={`/account/packages/${ticket.relatedPackageNo}`} className="inline-flex items-center gap-1 text-sky-700 hover:underline">
                  {ticket.relatedPackageNo}<ExternalLink className="size-3" />
                </Link>
              ) : "-"}
            />
            <Separator />
            <p className="text-xs leading-5 text-slate-500">{t("ownershipHint")}</p>
          </CardContent>
        </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="border-slate-200 bg-white/90">
          <CardHeader><CardTitle>{t("conversation")}</CardTitle></CardHeader>
          <CardContent><TicketConversation messages={ticket.messages} /></CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/90">
          <CardHeader><CardTitle>{t("reply")}</CardTitle></CardHeader>
          <CardContent><TicketReplyForm status={ticket.status} /></CardContent>
        </Card>
        </section>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className="mt-1 font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function MobileTicketInfo({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3">
      <div className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className="text-sm font-black text-slate-950">{value}</div>
    </div>
  );
}
