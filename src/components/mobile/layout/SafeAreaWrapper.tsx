import { cn } from "@/lib/utils";

export function SafeAreaWrapper({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mobile-safe-area", className)}>
      {children}
    </div>
  );
}
