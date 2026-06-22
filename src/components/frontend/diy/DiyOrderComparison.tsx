import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const comparisonRows = ["suitable", "parsing", "speed", "price", "complexity"] as const;

export function DiyOrderComparison() {
  const t = useTranslations("DiyOrder.comparison");

  return (
    <section className="site-container py-10">
      <div className="mb-5">
        <div className="label">{t("eyebrow")}</div>
        <h2 className="mt-2 text-3xl font-black text-[#101828]">{t("title")}</h2>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#667085]">{t("description")}</p>
      </div>
      <Card className="border-[#dfe7f1] bg-white shadow-[0_22px_60px_rgba(15,23,42,0.06)]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f8fafc]">
                <TableHead className="px-5 py-4 font-black text-[#344054]">{t("columns.feature")}</TableHead>
                <TableHead className="px-5 py-4 font-black text-[#344054]">
                  <Badge className="rounded-full bg-[#edf7ff] text-[#0a83ff]">{t("columns.agent")}</Badge>
                </TableHead>
                <TableHead className="px-5 py-4 font-black text-[#344054]">
                  <Badge className="rounded-full bg-[#fff1f2] text-[#d9142f]">{t("columns.diy")}</Badge>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonRows.map((row) => (
                <TableRow key={row}>
                  <TableCell className="px-5 py-4 font-black text-[#101828]">{t(`rows.${row}.feature`)}</TableCell>
                  <TableCell className="px-5 py-4 font-semibold leading-6 text-[#667085]">{t(`rows.${row}.agent`)}</TableCell>
                  <TableCell className="px-5 py-4 font-semibold leading-6 text-[#667085]">{t(`rows.${row}.diy`)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
