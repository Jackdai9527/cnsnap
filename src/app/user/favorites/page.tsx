import { StoredProductList } from "@/components/user/StoredProductList";

export default function UserFavoritesPage() {
  return (
    <section className="space-y-5">
      <div className="brand-surface rounded-[28px] p-6 md:p-7">
        <div className="label">Saved products</div>
        <h1 className="mt-2 font-display text-5xl font-black text-[#101828]">Favorite products</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#667085]">
          Products saved from product detail pages stay here for quick comparison and later checkout.
        </p>
      </div>
      <StoredProductList type="favorites" />
    </section>
  );
}
