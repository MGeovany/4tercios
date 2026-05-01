"use client";

import { useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type AuthProfile = {
  name: string;
  email: string;
  phone: string;
  website: string;
  instagram: string;
};

const EMPTY_PROFILE: AuthProfile = {
  name: "",
  email: "",
  phone: "",
  website: "",
  instagram: "",
};

function readText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function useAuthProfile() {
  const [profile, setProfile] = useState<AuthProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);

  const supabaseReady = useMemo(() => {
    try {
      getSupabaseBrowserClient();
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!supabaseReady) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function loadProfile() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;

        const meta = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
        setProfile({
          name: readText(meta.business_name) || readText(meta.full_name),
          email: data.user?.email ?? "",
          phone: readText(meta.phone),
          website: readText(meta.website),
          instagram: readText(meta.instagram).replace(/^@/, ""),
        });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [supabaseReady]);

  return { profile, loading };
}
