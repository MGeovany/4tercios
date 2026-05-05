"use client";

import { useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Tracks whether the browser has an active Supabase session (best-effort).
 * Returns false if Supabase env is missing.
 */
export function useHasSupabaseSession() {
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    async function bootstrap() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        if (mounted) setHasSession(Boolean(data.session));

        const { data: authListener } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            if (mounted) setHasSession(Boolean(session));
          }
        );

        unsubscribe = () => authListener.subscription.unsubscribe();
      } catch {
        // No env: keep false
      }
    }

    void bootstrap();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  return hasSession;
}
