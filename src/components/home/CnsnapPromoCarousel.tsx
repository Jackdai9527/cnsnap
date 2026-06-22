"use client";

import * as React from "react";
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

const promoSlides = [
  {
    src: "/brand/cnsnap-home/cnsnap-promo-01.png",
    alt: "CNSnap promo banner featuring shopping agent service highlights"
  },
  {
    src: "/brand/cnsnap-home/cnsnap-promo-02.png",
    alt: "CNSnap promo banner featuring member offers and shipping perks"
  },
  {
    src: "/brand/cnsnap-home/cnsnap-promo-03.png",
    alt: "CNSnap promo banner featuring warehouse and parcel services"
  },
  {
    src: "/brand/cnsnap-home/cnsnap-promo-04.png",
    alt: "CNSnap promo banner featuring sourcing and order workflow"
  },
  {
    src: "/brand/cnsnap-home/cnsnap-promo-05.png",
    alt: "CNSnap promo banner featuring platform shopping benefits"
  },
  {
    src: "/brand/cnsnap-home/cnsnap-promo-06.png",
    alt: "CNSnap promo banner featuring logistics and service support"
  },
  {
    src: "/brand/cnsnap-home/cnsnap-promo-07.png",
    alt: "CNSnap promo banner featuring discounts and customer guidance"
  },
  {
    src: "/brand/cnsnap-home/cnsnap-promo-08.png",
    alt: "CNSnap promo banner featuring package consolidation and global shipping"
  }
] as const;

export function CnsnapPromoCarousel() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setSelectedIndex(api.selectedScrollSnap());
    };

    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  React.useEffect(() => {
    if (!api) return;

    const timer = window.setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 3500);

    return () => window.clearInterval(timer);
  }, [api]);

  return (
    <section className="cnsnap-home-promo-section pb-10 md:pb-12" aria-label="CNSnap promotional banners">
      <div className="cnsnap-promo-shell">
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: true
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-5">
            {promoSlides.map((slide) => (
              <CarouselItem key={slide.src} className="basis-[90%] pl-5 sm:basis-[72%] lg:basis-[34%]">
                <div className="cnsnap-promo-card">
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    width={1174}
                    height={660}
                    sizes="(max-width: 640px) 88vw, (max-width: 1024px) 72vw, 34vw"
                    className="cnsnap-promo-image"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="cnsnap-promo-arrow left-4 hidden md:left-5 sm:inline-flex" />
          <CarouselNext className="cnsnap-promo-arrow right-4 hidden md:right-5 sm:inline-flex" />
        </Carousel>

        <div className="cnsnap-promo-dots" aria-hidden="true">
          {promoSlides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              className={cn("cnsnap-promo-dot", selectedIndex === index && "is-active")}
              onClick={() => api?.scrollTo(index)}
            >
              <span className="sr-only">Go to slide {index + 1}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
