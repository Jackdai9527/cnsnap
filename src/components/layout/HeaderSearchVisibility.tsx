"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function HeaderSearchVisibility({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const heroSearch = document.querySelector("[data-hero-search]");
    if (!heroSearch) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0.12,
        rootMargin: "-96px 0px 0px 0px"
      }
    );

    observer.observe(heroSearch);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className={cn(
        "header-search-visibility transition duration-300",
        visible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        className
      )}
      aria-hidden={!visible}
    >
      {children}
    </section>
  );
}
