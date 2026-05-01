"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { buildOnboardingPath, getOnboardingStepFromMetadata } from "@/lib/onboarding";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function stripSensitiveHash() {
  if (typeof window === "undefined" || !window.location.hash) return;

  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return;

  const hasAuthTokens =
    hash.includes("access_token=") ||
    hash.includes("refresh_token=") ||
    hash.includes("provider_token=");

  if (!hasAuthTokens) return;
  window.history.replaceState(
    {},
    document.title,
    window.location.pathname + window.location.search
  );
}

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let mounted = true;

    async function resolveAuthCallback() {
      let onboardingCompleted = false;
      let onboardingPath = buildOnboardingPath("business");
      try {
        const supabase = getSupabaseBrowserClient();

        // When using OAuth code flow (PKCE), the browser must exchange the `code`
        // for a session, otherwise client-side requests (like Storage uploads)
        // will run as anon and fail RLS.
        const code = searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error && !isMissingPkceVerifierError(error)) {
            throw error;
          }
        }

        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          throw new Error("No se pudo completar la sesión. Intenta iniciar sesión nuevamente.");
        }

        const { data } = await supabase.auth.getUser();
        const meta = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
        onboardingCompleted = meta.onboarding_completed === true;
        onboardingPath = buildOnboardingPath(getOnboardingStepFromMetadata(meta));
      } finally {
        stripSensitiveHash();
      }

      if (!mounted) return;
      const next = searchParams.get("next") || "/dashboard";
      router.replace(onboardingCompleted ? next : onboardingPath);
    }

    void resolveAuthCallback();

    return () => {
      mounted = false;
    };
  }, [router, searchParams]);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-6">
      <p className="text-muted-foreground text-sm">Validando inicio de sesión...</p>
    </div>
  );
}

function isMissingPkceVerifierError(error: { message?: string; name?: string }) {
  const name = error.name?.toLowerCase() ?? "";
  const message = error.message?.toLowerCase() ?? "";
  return (
    name.includes("authpkcecodeverifiermissingerror") ||
    message.includes("pkce code verifier not found in storage")
  );
}
