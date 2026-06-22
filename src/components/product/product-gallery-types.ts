export type ProductGalleryImage = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  highResSrc?: string;
};

export const productGalleryFallbackImage = "/brand/cnsnap-logo.svg";

export function normalizeProductGalleryImages(images: Array<ProductGalleryImage | string>, title = "Product image") {
  const normalized = images
    .map((image, index): ProductGalleryImage | null => {
      if (typeof image === "string") {
        return image
          ? {
              src: image,
              highResSrc: image,
              alt: index === 0 ? title : `${title} image ${index + 1}`,
              width: 1000,
              height: 1000
            }
          : null;
      }

      if (!image.src) return null;
      return {
        ...image,
        alt: image.alt || (index === 0 ? title : `${title} image ${index + 1}`),
        width: image.width ?? 1000,
        height: image.height ?? 1000
      };
    })
    .filter((image): image is ProductGalleryImage => Boolean(image));

  const seen = new Set<string>();
  return normalized.filter((image) => {
    const key = image.highResSrc || image.src;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getGalleryImageSrc(image: ProductGalleryImage) {
  return image.highResSrc || image.src || productGalleryFallbackImage;
}
