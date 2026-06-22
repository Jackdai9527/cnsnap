"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductImageZoom } from "@/components/product/ProductImageZoom";
import { ProductLightbox } from "@/components/product/ProductLightbox";
import { ProductThumbnailCarousel } from "@/components/product/ProductThumbnailCarousel";
import {
  normalizeProductGalleryImages,
  type ProductGalleryImage
} from "@/components/product/product-gallery-types";

type ProductImageGalleryProps = {
  images?: Array<ProductGalleryImage | string>;
  title?: string;
  initialIndex?: number;
};

const mockImages: ProductGalleryImage[] = [
  {
    src: "https://picsum.photos/seed/cnsnap-gallery-01/900/900",
    highResSrc: "https://picsum.photos/seed/cnsnap-gallery-01/1800/1800",
    alt: "Mock product front view",
    width: 900,
    height: 900
  },
  {
    src: "https://picsum.photos/seed/cnsnap-gallery-02/900/900",
    highResSrc: "https://picsum.photos/seed/cnsnap-gallery-02/1800/1800",
    alt: "Mock product detail view",
    width: 900,
    height: 900
  },
  {
    src: "https://picsum.photos/seed/cnsnap-gallery-03/900/900",
    highResSrc: "https://picsum.photos/seed/cnsnap-gallery-03/1800/1800",
    alt: "Mock product texture view",
    width: 900,
    height: 900
  },
  {
    src: "https://picsum.photos/seed/cnsnap-gallery-04/900/900",
    highResSrc: "https://picsum.photos/seed/cnsnap-gallery-04/1800/1800",
    alt: "Mock product package view",
    width: 900,
    height: 900
  }
];

export function ProductImageGallery({
  images = mockImages,
  title = "Product image",
  initialIndex = 0
}: ProductImageGalleryProps) {
  const [variantImage, setVariantImage] = useState("");
  const baseImages = useMemo(
    () => normalizeProductGalleryImages(images.length ? images : mockImages, title),
    [images, title]
  );
  const galleryImages = useMemo(() => {
    const variantImages = variantImage
      ? normalizeProductGalleryImages(
          [
            {
              src: variantImage,
              highResSrc: variantImage,
              alt: `${title} selected variant`,
              width: 1000,
              height: 1000
            },
            ...baseImages
          ],
          title
        )
      : baseImages;

    return variantImages;
  }, [baseImages, title, variantImage]);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const safeActiveIndex = Math.min(activeIndex, Math.max(galleryImages.length - 1, 0));
  const activeImage = galleryImages[safeActiveIndex] ?? galleryImages[0];

  useEffect(() => {
    function onVariantImageChange(event: Event) {
      const image = (event as CustomEvent<{ image?: string }>).detail?.image;
      if (!image) return;
      setVariantImage(image);
      setActiveIndex(0);
    }

    window.addEventListener("cnsnap:variant-image-change", onVariantImageChange);
    return () => window.removeEventListener("cnsnap:variant-image-change", onVariantImageChange);
  }, []);

  function go(delta: number) {
    if (!galleryImages.length) return;
    setActiveIndex((current) => (current + delta + galleryImages.length) % galleryImages.length);
  }

  return (
    <section className="goods-gallery w-full min-w-0 space-y-4" aria-label="Product image gallery">
      <div className="relative">
        <ProductImageZoom
          image={activeImage}
          onOpen={() => setLightboxOpen(true)}
          priority
        />

        {galleryImages.length > 1 ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Previous product image"
              className="absolute left-4 top-1/2 z-30 size-10 -translate-y-1/2 rounded-full border-white/80 bg-white/90 text-[#667085] shadow-[0_12px_26px_rgba(16,24,40,0.12)] hover:border-[#e60012] hover:text-[#e60012]"
              onClick={() => go(-1)}
            >
              <ChevronLeft size={20} />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Next product image"
              className="absolute right-4 top-1/2 z-30 size-10 -translate-y-1/2 rounded-full border-white/80 bg-white/90 text-[#667085] shadow-[0_12px_26px_rgba(16,24,40,0.12)] hover:border-[#e60012] hover:text-[#e60012]"
              onClick={() => go(1)}
            >
              <ChevronRight size={20} />
            </Button>
          </>
        ) : null}
      </div>

      <ProductThumbnailCarousel
        images={galleryImages}
        activeIndex={safeActiveIndex}
        onSelect={setActiveIndex}
      />

      <ProductLightbox
        images={galleryImages}
        open={lightboxOpen}
        index={safeActiveIndex}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setActiveIndex}
      />
    </section>
  );
}

export type { ProductGalleryImage };
