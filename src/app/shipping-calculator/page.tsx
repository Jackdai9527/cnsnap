import { ShieldAlert } from "lucide-react";
import { ShippingCalculator } from "@/components/shipping/ShippingCalculator";

export default function ShippingCalculatorPage() {
  return (
    <main className="brand-page pb-12">
      <section className="frontend-page-shell">
        <div className="frontend-page-inner flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="label">International freight</div>
            <h1 className="frontend-title">Shipping calculator</h1>
            <p className="frontend-lede">Compare international routes using destination, weight, dimensions, and category before creating a parcel.</p>
          </div>
          <div className="max-w-xl rounded-3xl border border-[#ffd2d7] bg-[#fff1f2] p-4 text-sm font-semibold leading-6 text-[#e60012]">
            <div className="flex items-center gap-2 font-black"><ShieldAlert size={16} /> Final audit applies</div>
            Some products may be restricted by country, carrier, or category. Final availability depends on platform review.
          </div>
        </div>
      </section>
      <div className="site-container py-8">
        <ShippingCalculator />
      </div>
    </main>
  );
}
