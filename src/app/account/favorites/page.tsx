import { MobileSectionShell } from "@/components/mobile/layout/MobileSectionShell";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { MobileFavoritesWorkspace } from "@/components/account/mobile/MobileFavoritesWorkspace";
import { StoredProductList } from "@/components/user/StoredProductList";

export default function AccountFavoritesPage() {
  return (
    <>
      <MobileSectionShell
        title="Favorites"
        kicker="Favorites"
        className="md:hidden"
        minimalHeader
        showBackButton
      >
        <section className="card-stack-section">
          <MobileFavoritesWorkspace searchPlaceholder="Search saved products..." />
        </section>
      </MobileSectionShell>

      <div className="hidden md:block">
        <AccountPageHeader
          title="Favorite products"
          description="Products saved from product detail pages stay here for quick comparison and later checkout."
        />
        <StoredProductList type="favorites" />
      </div>
    </>
  );
}
