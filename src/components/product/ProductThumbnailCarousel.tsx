"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import {
  type ProductGalleryImage,
  productGalleryFallbackImage
} from "@/components/product/product-gallery-types";

type ProductThumbnailCarouselProps = {
  images: ProductGalleryImage[];
  activeIndex: number;
  onSelect: (index: number) => void;
};

export function ProductThumbnailCarousel({
  images,
  activeIndex,
  onSelect
}: ProductThumbnailCarouselProps) {
  if (images.length <= 1) return null;

  return (
    <Carousel
      opts={{
        align: "start",
        dragFree: true,
        containScroll: "trimSnaps"
      }}
      className="relative px-10"
      aria-label="Product image thumbnails"
    >
      <CarouselContent className="-ml-2">
        {images.map((image, index) => (
          <CarouselItem key={`${image.src}-${index}`} className="basis-[78px] pl-2 sm:basis-[90px]">
            <ThumbnailButton
              image={image}
              index={index}
              active={activeIndex === index}
              onSelect={onSelect}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-0 border-[#d9e7ff] bg-white text-[#667085] shadow-sm hover:border-[#e60012] hover:text-[#e60012]" />
      <CarouselNext className="right-0 border-[#d9e7ff] bg-white text-[#667085] shadow-sm hover:border-[#e60012] hover:text-[#e60012]" />
    </Carousel>
  );
}

function ThumbnailButton({
  image,
  index,
  active,
  onSelect
}: {
  image: ProductGalleryImage;
  index: number;
  active: boolean;
  onSelect: (index: number) => void;
}) {
  const [fallback, setFallback] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      aria-label={`Show product image ${index + 1}`}
      aria-current={active ? "true" : undefined}
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-2xl border bg-white transition",
        "hover:-translate-y-0.5 hover:border-[#e60012] hover:shadow-[0_12px_26px_rgba(16,24,40,0.10)]",
        active
          ? "border-[#e60012] shadow-[0_0_0_3px_rgba(230,0,18,0.14)]"
          : "border-[#d9e7ff]"
      )}
    >
      <Image
        src={fallback ? productGalleryFallbackImage : image.src}
        alt=""
        fill
        sizes="90px"
        className="object-contain p-1.5"
        onError={() => setFallback(true)}
      />
    </button>
  );
}
