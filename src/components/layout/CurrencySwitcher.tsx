"use client";

import { ChevronDown } from "lucide-react";
import { useCurrency } from "@/components/currency/CurrencyProvider";

export function CurrencySwitcher({ currencies, defaultCurrency = "USD" }: { currencies: string[]; defaultCurrency?: string }) {
  const currencyState = useCurrency();
  const options = currencies.length ? currencies : currencyState.currencies;
  const selected = options.includes(currencyState.selectedCurrency) ? currencyState.selectedCurrency : defaultCurrency;

  return (
    <div className="group relative">
      <button type="button" className="inline-flex items-center gap-1 rounded-full border border-[#d9e7ff] bg-white px-3 py-1.5 text-xs font-black text-[#344054] shadow-[0_8px_20px_rgba(10,131,255,0.05)] transition hover:border-[#0a83ff] hover:text-[#0a83ff]">
        {selected}
        <ChevronDown size={13} className="transition group-hover:rotate-180" />
      </button>
      <div className="brand-surface invisible absolute right-0 top-[calc(100%+8px)] z-50 grid max-h-80 w-44 grid-cols-2 gap-1 overflow-y-auto rounded-2xl p-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
        {currencies.map((currency) => (
          <button
            key={currency}
            type="button"
            className={`rounded-xl px-2 py-2 text-xs font-black transition ${selected === currency ? "bg-[#fff1f2] text-[#e60012]" : "text-[#667085] hover:bg-[#edf7ff] hover:text-[#0a83ff]"}`}
            onClick={() => currencyState.selectCurrency(currency)}
          >
            {currency}
          </button>
        ))}
      </div>
    </div>
  );
}
