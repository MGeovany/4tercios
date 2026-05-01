"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

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
  window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let mounted = true;

    async function resolveAuthCallback() {
      try {
        const supabase = getSupabaseBrowserClient();
        await supabase.auth.getSession();
      } finally {
        stripSensitiveHash();
      }

      if (!mounted) return;
      const next = searchParams.get("next") || "/dashboard";
      router.replace(next);
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
