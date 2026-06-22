"use client";

import { useState } from "react";

type CheckoutPaymentOption = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  content: React.ReactNode;
};

type CheckoutPaymentMethodsProps = {
  initialMethod: string;
  options: CheckoutPaymentOption[];
};

export function CheckoutPaymentMethods({ initialMethod, options }: CheckoutPaymentMethodsProps) {
  const [selectedMethod, setSelectedMethod] = useState(initialMethod);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#eadfe4] bg-white">
      {options.map((option, index) => {
        const selected = selectedMethod === option.id;
        return (
          <div key={option.id} className={index ? "border-t border-[#eadfe4]" : ""}>
            <label className={`flex cursor-pointer items-center gap-3 px-4 py-4 transition ${selected ? "bg-[#fcfcfd]" : "bg-white hover:bg-[#fafafa]"}`}>
              <input
                type="radio"
                name="checkout_payment_method"
                value={option.id}
                checked={selected}
                onChange={() => setSelectedMethod(option.id)}
                className="size-4 accent-[#e60012]"
              />
              <span className={`grid size-9 shrink-0 place-items-center rounded-full ${selected ? "bg-[#fff1f2]" : "bg-slate-100"}`}>{option.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-black text-[#111827]">{option.title}</span>
                {!selected ? <span className="mt-1 block text-xs font-semibold text-[#8a8190]">{option.subtitle}</span> : null}
              </span>
            </label>
            {selected ? <div className="border-t border-[#f1f2f4] bg-[#fcfcfd] px-4 py-4">{option.content}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
