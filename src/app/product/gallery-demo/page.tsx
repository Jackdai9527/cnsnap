import { ProductImageGallery, type ProductGalleryImage } from "@/components/product/ProductImageGallery";

const mockImages: ProductGalleryImage[] = [
  {
    src: "https://picsum.photos/seed/cnsnap-product-gallery-a/900/900",
    highResSrc: "https://picsum.photos/seed/cnsnap-product-gallery-a/1800/1800",
    alt: "Demo product front angle",
    width: 900,
    height: 900
  },
  {
    src: "https://picsum.photos/seed/cnsnap-product-gallery-b/900/900",
    highResSrc: "https://picsum.photos/seed/cnsnap-product-gallery-b/1800/1800",
    alt: "Demo product material detail",
    width: 900,
    height: 900
  },
  {
    src: "https://picsum.photos/seed/cnsnap-product-gallery-c/900/900",
    highResSrc: "https://picsum.photos/seed/cnsnap-product-gallery-c/1800/1800",
    alt: "Demo product package detail",
    width: 900,
    height: 900
  },
  {
    src: "https://picsum.photos/seed/cnsnap-product-gallery-d/900/900",
    highResSrc: "https://picsum.photos/seed/cnsnap-product-gallery-d/1800/1800",
    alt: "Demo product scale view",
    width: 900,
    height: 900
  },
  {
    src: "https://picsum.photos/seed/cnsnap-product-gallery-e/900/900",
    highResSrc: "https://picsum.photos/seed/cnsnap-product-gallery-e/1800/1800",
    alt: "Demo product side view",
    width: 900,
    height: 900
  }
];

export default function ProductGalleryDemoPage() {
  return (
    <main className="brand-page py-10">
      <div className="site-container grid gap-8 lg:grid-cols-[minmax(360px,680px)_1fr]">
        <ProductImageGallery images={mockImages} title="Mock gallery product" />
        <section className="rounded-[28px] border border-[#d9e7ff] bg-white p-6 shadow-[0_18px_45px_rgba(10,131,255,0.08)]">
          <p className="text-xs font-black uppercase text-[#e60012]">Gallery Demo</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#111827]">Product image gallery test</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#667085]">
            This page uses mock images to verify thumbnail selection, desktop hover zoom, mobile click behavior, and lightbox navigation.
          </p>
        </section>
      </div>
    </main>
  );
}
