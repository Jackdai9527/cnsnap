import { cn } from "@/lib/utils";
import { MobilePageContainer } from "@/components/mobile/layout/MobilePageContainer";
import { SafeAreaWrapper } from "@/components/mobile/layout/SafeAreaWrapper";

export function MobileAppShell({
  children,
  className,
  showBottomSpacing = true
}: {
  children: React.ReactNode;
  className?: string;
  showBottomSpacing?: boolean;
}) {
  return (
    <MobilePageContainer className={cn(showBottomSpacing && "mobile-app-shell-with-bottom-nav", className)}>
      <SafeAreaWrapper className="mobile-app-shell">
        {children}
      </SafeAreaWrapper>
    </MobilePageContainer>
  );
}
