"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type MobileStickyBackButtonProps = {
  href?: string;
  label?: string;
  className?: string;
  sticky?: boolean;
};

export function MobileStickyBackButton({
  href,
  label = "Back",
  className,
  sticky = true
}: MobileStickyBackButtonProps) {
  const router = useRouter();

  const content = (
    <>
      <ArrowLeft className="size-4" />
      <span>{label}</span>
    </>
  );

  if (href) {
    return (
      <div className={cn(sticky ? "mobile-sticky-back-shell" : "mobile-inline-back-shell", className)}>
        <Link href={href} className="mobile-section-back-btn" aria-label={label}>
          {content}
        </Link>
      </div>
    );
  }

  return (
    <div className={cn(sticky ? "mobile-sticky-back-shell" : "mobile-inline-back-shell", className)}>
      <button type="button" onClick={() => router.back()} className="mobile-section-back-btn" aria-label={label}>
        {content}
      </button>
    </div>
  );
}
