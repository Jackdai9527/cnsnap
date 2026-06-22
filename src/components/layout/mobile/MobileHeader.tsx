"use client";

import Image from "next/image";
import Link from "next/link";

import { CnsnapSearchBox } from "@/components/product/CnsnapSearchBox";

type MobileHeaderProps = {
  homeHref: string;
};

export function MobileHeader({ homeHref }: MobileHeaderProps) {
  return (
    <div className="mobile-header-shell md:hidden">
      <div className="mobile-header-topline">
        <Link href={homeHref} className="mobile-header-brand" aria-label="CNSnap home">
          <Image
            src="/brand/cnsnap-logo.svg"
            alt="CNSnap"
            width={1540}
            height={453}
            priority
            className="mobile-header-logo"
          />
        </Link>
        <div className="mobile-inline-header-search">
          <CnsnapSearchBox compact submitIconOnly />
        </div>
      </div>
    </div>
  );
}
