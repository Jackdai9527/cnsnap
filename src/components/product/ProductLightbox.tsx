"use client";

import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import {
  getGalleryImageSrc,
  type ProductGalleryImage
} from "@/components/product/product-gallery-types";

type ProductLightboxProps = {
  images: ProductGalleryImage[];
  open: boolean;
  index: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
};

export function ProductLightbox({
  images,
  open,
  index,
  onClose,
  onIndexChange
}: ProductLightboxProps) {
  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={images.map((image) => ({
        src: getGalleryImageSrc(image),
        alt: image.alt,
        width: image.width,
        height: image.height,
        thumbnail: image.src
      }))}
      plugins={[Thumbnails, Zoom]}
      carousel={{
        finite: images.length <= 1,
        imageFit: "contain"
      }}
      thumbnails={{
        position: "bottom",
        width: 84,
        height: 84,
        border: 2,
        borderRadius: 12,
        padding: 4,
        gap: 10,
        imageFit: "contain"
      }}
      zoom={{
        maxZoomPixelRatio: 2.8,
        scrollToZoom: true
      }}
      animation={{ fade: 180, swipe: 220, zoom: 220 }}
      controller={{ closeOnBackdropClick: true }}
      on={{
        view: ({ index }) => onIndexChange?.(index)
      }}
    />
  );
}
