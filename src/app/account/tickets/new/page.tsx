import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { MobileSectionShell } from "@/components/mobile/layout/MobileSectionShell";
import { TicketForm } from "@/components/account/tickets/TicketForm";
import { Button } from "@/components/ui/button";

type NewTicketPageProps = {
  searchParams: Promise<{ orderId?: string; packageId?: string }>;
};

export default async function NewTicketPage({ searchParams }: NewTicketPageProps) {
  const t = await getTranslations("account.tickets.newForm");
  const params = await searchParams;

  return (
    <>
      <MobileSectionShell
        title={t("pageTitle")}
        description={t("pageDescription")}
        kicker={t("pageTitle")}
        className="md:hidden"
        minimalHeader
        showBackButton
      >
        <section className="card-stack-section">
          <TicketForm defaultOrderId={params.orderId} defaultPackageId={params.packageId} />
        </section>
      </MobileSectionShell>

      <div className="hidden max-w-5xl md:block">
        <AccountPageHeader
          title={t("pageTitle")}
          description={t("pageDescription")}
          action={
            <Button asChild variant="outline">
              <Link href="/account/tickets"><ArrowLeft />{t("back")}</Link>
            </Button>
          }
        />
        <TicketForm defaultOrderId={params.orderId} defaultPackageId={params.packageId} />
      </div>
    </>
  );
}
