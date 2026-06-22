"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import type { PaymentMethodPoint } from "@/types/admin-dashboard";

type PaymentMethodPieChartProps = {
  data: PaymentMethodPoint[];
  loading?: boolean;
};

const chartColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function PaymentMethodPieChart({ data, loading }: PaymentMethodPieChartProps) {
  return (
    <ChartCard title="Payment Methods" description="Payment share across completed order payments." loading={loading} empty={!data.length}>
      <div className="grid h-full gap-3 sm:grid-cols-[minmax(0,1fr)_150px] sm:items-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="method" innerRadius="58%" outerRadius="86%" paddingAngle={3}>
              {data.map((item, index) => (
                <Cell key={item.method} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value}%`, "Share"]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid gap-2">
          {data.map((item, index) => (
            <div key={item.method} className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
              <span className="flex min-w-0 items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: chartColors[index % chartColors.length] }} />
                <span className="truncate">{item.method}</span>
              </span>
              <span className="tabular-nums text-slate-950">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
