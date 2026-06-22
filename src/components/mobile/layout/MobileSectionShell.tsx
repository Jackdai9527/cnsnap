"use client";

import { cn } from "@/lib/utils";
import { MobileAppShell } from "@/components/mobile/layout/MobileAppShell";
import { MobileAccountSubnav } from "@/components/mobile/business/MobileAccountSubnav";
import { MobileStickyBackButton } from "@/components/mobile/layout/MobileStickyBackButton";

export function MobileSectionShell({
  title,
  description,
  kicker,
  children,
  className,
  showBottomSpacing = true,
  accountSubnav = false,
  compactHeader = false,
  minimalHeader = false,
  hideHeader = false,
  showBackButton = false,
  backHref,
  backLabel,
  stickyBackButton = true
}: {
  title: string;
  description?: string;
  kicker?: string;
  children: React.ReactNode;
  className?: string;
  showBottomSpacing?: boolean;
  accountSubnav?: boolean;
  compactHeader?: boolean;
  minimalHeader?: boolean;
  hideHeader?: boolean;
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
  stickyBackButton?: boolean;
}) {
  return (
    <MobileAppShell className={cn("mobile-section-shell", className)} showBottomSpacing={showBottomSpacing}>
      {showBackButton ? <MobileStickyBackButton href={backHref} label={backLabel} sticky={stickyBackButton} /> : null}
      <section className="card-stack-section">
        {!hideHeader ? (
          <div className={cn("mobile-home-section-heading", compactHeader && "mobile-section-heading-compact", minimalHeader && "mobile-section-heading-minimal")}>
            {kicker ? <div className="mobile-home-kicker">{kicker}</div> : null}
            <h1 className={cn("mobile-home-title mobile-section-shell-title", minimalHeader && "mobile-section-shell-title-minimal")}>{title}</h1>
            {description && !minimalHeader ? <p className={cn("mobile-home-copy", compactHeader && "mobile-section-shell-copy-compact")}>{description}</p> : null}
          </div>
        ) : null}
        {accountSubnav ? <MobileAccountSubnav className="mt-4" primaryOnly /> : null}
      </section>
      {children}
    </MobileAppShell>
  );
}
