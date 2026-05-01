import { Suspense } from "react";

import { AuthCallbackClient } from "./callback-client";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center px-6">
          <p className="text-muted-foreground text-sm">Validando inicio de sesión...</p>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
