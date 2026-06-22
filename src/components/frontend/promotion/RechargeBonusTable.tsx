import Link from "next/link";
import { WalletCards } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { rechargeBonuses } from "@/components/frontend/promotion/promotion-data";

export function RechargeBonusTable() {
  const t = useTranslations("Promotion.recharge");

  return (
    <Card className="border-[#dfe7f1] bg-white shadow-[0_22px_60px_rgba(15,23,42,0.06)]">
      <CardHeader className="border-b border-[#eef2f6]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="label">{t("eyebrow")}</div>
            <CardTitle className="mt-2 text-3xl font-black text-[#101828]">{t("title")}</CardTitle>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{t("description")}</p>
          </div>
          <Button asChild className="h-11 rounded-full bg-[#d9142f] px-5 font-black text-white hover:bg-[#b90f25]">
            <Link href="/account/recharge">
              <WalletCards size={17} />
              {t("rechargeNow")}
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f8fafc]">
              <TableHead className="px-5 py-4 font-black text-[#344054]">{t("columns.rechargeAmount")}</TableHead>
              <TableHead className="px-5 py-4 font-black text-[#344054]">{t("columns.bonusAmount")}</TableHead>
              <TableHead className="px-5 py-4 font-black text-[#344054]">{t("columns.validity")}</TableHead>
              <TableHead className="px-5 py-4 font-black text-[#344054]">{t("columns.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rechargeBonuses.map((bonus) => (
              <TableRow key={bonus.rechargeAmount}>
                <TableCell className="px-5 py-4 text-base font-black text-[#101828]">{bonus.rechargeAmount}</TableCell>
                <TableCell className="px-5 py-4 text-base font-black text-[#d9142f]">{bonus.bonusAmount}</TableCell>
                <TableCell className="px-5 py-4 font-semibold text-[#667085]">{bonus.validity}</TableCell>
                <TableCell className="px-5 py-4">
                  <Badge className={bonus.status === "active" ? "rounded-full bg-[#ecfdf3] text-[#027a48]" : "rounded-full bg-[#fffbeb] text-[#b54708]"}>
                    {t(`status.${bonus.status}`)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
