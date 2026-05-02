"use client";

import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageTransition } from "@/components/animations/page-transition";
import { BrandThemeSync } from "@/components/brand-theme-sync";
import { AppStoreProvider } from "@/lib/local-store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppStoreProvider>
      <BrandThemeSync />
      <TooltipProvider delayDuration={200}>
        <React.Suspense fallback={children}>
          <PageTransition>{children}</PageTransition>
        </React.Suspense>
      </TooltipProvider>
    </AppStoreProvider>
  );
}
