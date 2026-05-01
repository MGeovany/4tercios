import { Suspense } from "react";

import { OnboardingClient } from "./onboarding-client";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center px-6">
          <p className="text-muted-foreground text-sm">Preparando tu cuenta...</p>
        </div>
      }
    >
      <OnboardingClient />
    </Suspense>
  );
}
