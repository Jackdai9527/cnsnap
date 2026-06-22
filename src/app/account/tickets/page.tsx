"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { AccountTicketsTable } from "@/components/account/tickets/AccountTicketsTable";
import { Button } from "@/components/ui/button";
import { useMyTickets } from "@/hooks/account/useMyTickets";

export default function AccountTicketsPage() {
  const t = useTranslations("account.tickets.page");
  const { data: tickets = [], isLoading } = useMyTickets();

  return (
    <>
      <div className="md:hidden">
        {isLoading ? (
          <div className="mobile-page-container mobile-app-shell-with-bottom-nav">
            <div className="mobile-safe-area mobile-app-shell">
              <section className="card-stack-section">
                <div className="mobile-cart-empty">
                  <h2>{t("title")}</h2>
                  <p>{t("loading")}</p>
                </div>
              </section>
            </div>
          </div>
        ) : (
          <AccountTicketsTable data={tickets} />
        )}
      </div>
      <div className="hidden md:block">
        <AccountPageHeader
          title={t("title")}
          description={t("description")}
          action={
            <Button asChild>
              <Link href="/account/tickets/new"><Plus />{t("newTicket")}</Link>
            </Button>
          }
        />
        {isLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500">{t("loading")}</div>
        ) : (
          <AccountTicketsTable data={tickets} />
        )}
      </div>
    </>
  );
}
