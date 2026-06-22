"use client";

import { useRef, useState } from "react";
import { Calculator, RotateCcw } from "lucide-react";
import { money } from "@/lib/currency";
import { countryOptions } from "@/lib/countries";

type Estimate = {
  id: number;
  code: string;
  name: string;
  feeUsd: number;
  feeCny?: number;
  chargeableWeight: number;
  deliveryTime: string;
  rate?: {
    freightRmbPerKg: number;
    handlingFeeRmb: number;
    maxWeightKg: number;
  };
};

export function ShippingCalculator() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    const response = await fetch("/api/shipping/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });
    setEstimates(await response.json());
    setLoading(false);
  }

  function resetCalculator() {
    formRef.current?.reset();
    setEstimates([]);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <form ref={formRef} action={onSubmit} className="panel h-fit p-5">
        <div className="flex items-center gap-2 font-display text-3xl font-semibold">
          <Calculator size={24} /> Freight estimator
        </div>
        <div className="mt-5 grid gap-4">
          <label>
            <span className="label">Country</span>
            <select name="country" defaultValue="" className="input mt-1" required>
              <option value="" disabled>Select destination</option>
              {countryOptions.map((country) => (
                <option key={country.iso2} value={country.iso2}>{country.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Actual weight kg</span>
            <input name="weightKg" type="number" step="0.01" min="0" placeholder="1.20" className="input mt-1" required />
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label>
              <span className="label">L cm</span>
              <input name="lengthCm" type="number" min="0" placeholder="35" className="input mt-1" />
            </label>
            <label>
              <span className="label">W cm</span>
              <input name="widthCm" type="number" min="0" placeholder="25" className="input mt-1" />
            </label>
            <label>
              <span className="label">H cm</span>
              <input name="heightCm" type="number" min="0" placeholder="18" className="input mt-1" />
            </label>
          </div>
          <label>
            <span className="label">Category</span>
            <select name="category" defaultValue="general" className="input mt-1">
              {["general", "fashion", "electronics", "sensitive", "liquid", "food", "battery"].map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <button className="btn-primary" disabled={loading}>{loading ? "Estimating..." : "Calculate"}</button>
            <button type="button" className="btn-secondary px-4" onClick={resetCalculator}>
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </div>
      </form>
      <section className="space-y-3">
        {estimates.length ? estimates.map((estimate) => (
          <div key={estimate.id} className="panel grid gap-3 p-5 md:grid-cols-[1fr_auto]">
            <div>
              <div className="badge">{estimate.code}</div>
              <h2 className="mt-2 font-display text-3xl font-semibold">{estimate.name}</h2>
              <p className="mt-1 text-sm text-[#667085]">Chargeable weight {estimate.chargeableWeight}kg · {estimate.deliveryTime}</p>
              {estimate.rate ? (
                <p className="mt-1 text-sm text-[#667085]">
                  RMB {estimate.rate.freightRmbPerKg}/KG + RMB {estimate.rate.handlingFeeRmb}/parcel · limit {estimate.rate.maxWeightKg}kg
                </p>
              ) : null}
            </div>
            <div className="text-right">
              <div className="font-display text-4xl font-semibold text-[#e60012]">{money(estimate.feeUsd)}</div>
              {estimate.feeCny ? <div className="text-sm font-semibold text-[#667085]">CN ￥{estimate.feeCny.toFixed(2)}</div> : null}
            </div>
          </div>
        )) : (
          <div className="panel p-10">
            <h2 className="font-display text-3xl font-semibold">Enter parcel details to compare channels.</h2>
            <p className="mt-3 max-w-xl text-[#667085]">
              Formula: billable weight uses the larger of actual weight, volume weight, and minimum chargeable weight.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
