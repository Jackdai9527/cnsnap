import { cn } from "@/lib/utils";

export function MobilePageContainer({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mobile-page-container md:hidden", className)}>
      {children}
    </div>
  );
}
