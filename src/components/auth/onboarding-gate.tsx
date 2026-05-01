"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { buildOnboardingPath, getOnboardingStepFromMetadata } from "@/lib/onboarding";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const supabaseReady = useMemo(() => {
    try {
      getSupabaseBrowserClient();
      return true;
    } catch {
      return false;
    }
  }, []);

  const [ready, setReady] = useState(() => !supabaseReady);

  useEffect(() => {
    if (!supabaseReady) return;

    let mounted = true;

    async function guard() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.auth.getUser();

        if (!mounted) return;

        if (error || !data.user) {
          router.replace("/login");
          return;
        }

        const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
        if (meta.onboarding_completed !== true) {
          router.replace(buildOnboardingPath(getOnboardingStepFromMetadata(meta)));
          return;
        }

        setReady(true);
      } catch {
        if (!mounted) return;
        router.replace("/login");
      }
    }

    void guard();

    return () => {
      mounted = false;
    };
  }, [router, supabaseReady]);

  if (!ready) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-6">
        <p className="text-muted-foreground text-sm">Preparando tu cuenta...</p>
      </div>
    );
  }

  return <>{children}</>;
}
