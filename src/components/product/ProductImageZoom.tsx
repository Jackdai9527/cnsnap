"use client";

import Image from "next/image";
import InnerImageZoom from "react-inner-image-zoom";
import { Maximize2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  getGalleryImageSrc,
  type ProductGalleryImage,
  productGalleryFallbackImage
} from "@/components/product/product-gallery-types";

type ProductImageZoomProps = {
  image?: ProductGalleryImage;
  onOpen?: () => void;
  sizes?: string;
  priority?: boolean;
};

export function ProductImageZoom({
  image,
  onOpen,
  sizes = "(min-width: 1024px) 716px, 100vw",
  priority = false
}: ProductImageZoomProps) {
  const [fallback, setFallback] = useState(false);

  if (!image) {
    return (
      <div className="grid aspect-square place-items-center rounded-[24px] border border-[#d9e7ff] bg-white text-sm font-bold text-[#98a2b3]">
        No image
      </div>
    );
  }

  const src = fallback ? productGalleryFallbackImage : image.src;
  const highResSrc = fallback ? productGalleryFallbackImage : getGalleryImageSrc(image);

  return (
    <div className="group relative aspect-square overflow-hidden rounded-[24px] border border-[#d9e7ff] bg-white shadow-[0_18px_45px_rgba(10,131,255,0.08)]">
      <button
        type="button"
        className="absolute inset-0 z-20 hidden cursor-zoom-in md:block"
        aria-label="Open product image gallery"
        onClick={onOpen}
      />

      <div className="hidden h-full w-full md:block">
        <InnerImageZoom
          src={src}
          zoomSrc={highResSrc}
          zoomType="hover"
          moveType="pan"
          zoomPreload
          hideHint
          fullscreenOnMobile={false}
          className="product-inner-zoom h-full w-full"
          imgAttributes={{
            alt: image.alt,
            width: image.width,
            height: image.height,
            draggable: false,
            sizes,
            onError: () => setFallback(true)
          }}
        />
      </div>

      <button
        type="button"
        className="relative block h-full w-full md:hidden"
        aria-label="Open product image gallery"
        onClick={onOpen}
      >
        <Image
          src={src}
          alt={image.alt}
          fill
          sizes={sizes}
          className="object-contain p-3"
          priority={priority}
          onError={() => setFallback(true)}
        />
      </button>

      <div
        className={cn(
          "pointer-events-none absolute right-4 top-4 z-30 inline-flex items-center justify-center rounded-full border border-white/80 bg-white/92 p-2 text-[#344054] shadow-[0_12px_28px_rgba(16,24,40,0.12)] backdrop-blur mobile-product-image-view-pill",
          "opacity-100 transition md:opacity-0 md:group-hover:opacity-100"
        )}
      >
        <Maximize2 size={14} />
      </div>
    </div>
  );
}
