import Link from "next/link";
import { handleOnlyPayCallback } from "@/modules/payment/onlypay";

type OnlyPayReturnPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OnlyPayReturnPage({ searchParams }: OnlyPayReturnPageProps) {
  const params = await searchParams;
  const data = Object.fromEntries(Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value || ""]));
  let status = "processing";
  let error = "";

  if (data.mchOrderNo && data.sign) {
    try {
      const result = await handleOnlyPayCallback(data);
      status = result.status;
    } catch (caught) {
      status = "failed";
      error = caught instanceof Error ? caught.message : "Unable to verify payment return.";
    }
  }

  return (
    <main className="site-container py-12">
      <section className="panel mx-auto max-w-2xl p-8 text-center">
        <div className="label">ONLYPAY</div>
        <h1 className="mt-2 font-display text-4xl font-semibold">{status === "paid" ? "Payment successful" : status === "failed" ? "Payment could not be verified" : "Payment processing"}</h1>
        <p className="mt-3 text-sm text-[#667085]">{error || "You can return to your order to check the latest payment status."}</p>
        <Link href="/account/orders" className="btn-primary mt-6">Back to orders</Link>
      </section>
    </main>
  );
}
