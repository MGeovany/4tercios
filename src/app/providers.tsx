"use client";

import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageTransition } from "@/components/animations/page-transition";
import { LensiaProvider } from "@/lib/local-store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LensiaProvider>
      <TooltipProvider delayDuration={200}>
        <React.Suspense fallback={children}>
          <PageTransition>{children}</PageTransition>
        </React.Suspense>
      </TooltipProvider>
    </LensiaProvider>
  );
}
