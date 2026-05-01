import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import type { StepMeta } from "./types";

export function OnboardingProgress({
  steps,
  currentIndex,
}: {
  steps: StepMeta[];
  currentIndex: number;
}) {
  return (
    <div className="w-full">
      <div className="text-muted-foreground mb-3 flex items-center justify-between text-xs">
        <span className="font-medium tracking-wide uppercase">
          Paso {Math.min(currentIndex + 1, steps.length)} de {steps.length}
        </span>
        <span>{steps[Math.min(currentIndex, steps.length - 1)]?.label}</span>
      </div>

      <div className="flex w-full items-center gap-1.5">
        {steps.map((step, i) => {
          const completed = i < currentIndex;
          const active = i === currentIndex;
          return (
            <div
              key={step.id}
              className={cn(
                "h-1 flex-1 overflow-hidden rounded-full transition-colors",
                completed || active ? "bg-foreground" : "bg-border"
              )}
            >
              {completed ? (
                <span className="sr-only">
                  <Check className="size-3" />
                  Completo
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
