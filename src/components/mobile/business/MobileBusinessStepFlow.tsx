"use client";

import { cn } from "@/lib/utils";

export type MobileBusinessStep = {
  key: string;
  label: string;
  description?: string;
  status: "complete" | "current" | "upcoming";
};

export function MobileBusinessStepFlow({
  steps,
  className
}: {
  steps: MobileBusinessStep[];
  className?: string;
}) {
  return (
    <section className={cn("mobile-business-step-flow", className)}>
      {steps.map((step, index) => (
        <div key={step.key} className="mobile-business-step-item">
          <div
            className={cn(
              "mobile-business-step-dot",
              step.status === "complete" && "is-complete",
              step.status === "current" && "is-current"
            )}
            aria-hidden="true"
          >
            {index + 1}
          </div>
          <div className="min-w-0">
            <div className="mobile-business-step-label">{step.label}</div>
            {step.description ? (
              <div className="mobile-business-step-copy">{step.description}</div>
            ) : null}
          </div>
        </div>
      ))}
    </section>
  );
}
