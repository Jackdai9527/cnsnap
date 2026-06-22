import { cn } from "@/lib/utils";

type MoneyDisplayProps = {
  amount?: number | null;
  currency?: "USD" | "CNY";
  secondaryAmount?: number | null;
  secondaryCurrency?: "USD" | "CNY";
  className?: string;
};

function formatMoney(amount: number, currency: "USD" | "CNY") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: currency === "CNY" ? "code" : "symbol"
  }).format(amount);
}

export function MoneyDisplay({
  amount,
  currency = "USD",
  secondaryAmount,
  secondaryCurrency = "CNY",
  className
}: MoneyDisplayProps) {
  const hasAmount = typeof amount === "number" && Number.isFinite(amount);
  const hasSecondary = typeof secondaryAmount === "number" && Number.isFinite(secondaryAmount);

  return (
    <span className={cn("inline-flex flex-col leading-tight tabular-nums", className)}>
      <span className="font-black text-slate-950">{hasAmount ? formatMoney(amount, currency) : "-"}</span>
      {hasSecondary ? (
        <span className="mt-0.5 text-xs font-semibold text-slate-400">{formatMoney(secondaryAmount, secondaryCurrency)}</span>
      ) : null}
    </span>
  );
}
