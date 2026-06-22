import { StoredProductList } from "@/components/user/StoredProductList";

export default function UserHistoryPage() {
  return (
    <section className="space-y-5">
      <div className="brand-surface rounded-[28px] p-6 md:p-7">
        <div className="label">Recently viewed</div>
        <h1 className="mt-2 font-display text-5xl font-black text-[#101828]">Browsing history</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#667085]">
          Reopen products you viewed recently without searching or pasting the link again.
        </p>
      </div>
      <StoredProductList type="history" />
    </section>
  );
}
