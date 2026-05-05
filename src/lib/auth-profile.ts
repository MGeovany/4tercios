"use client";

import { useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { type BrandFontId, type BrandPaletteId, normalizeHexColor } from "@/lib/branding";

export type AuthProfile = {
  name: string;
  email: string;
  phone: string;
  website: string;
  instagram: string;
  bio: string;
  avatarUrl: string;
  provider: string;
  brandColor: string;
  brandPalette: BrandPaletteId;
  brandFont: BrandFontId;
  watermarkLabel: string;
  watermarkOpacity: number;
  watermarkDensity: number;
  paymentsCountry: string;
  paymentsMethod: string;
  notifSales: boolean;
  notifMatches: boolean;
  notifWeeklyDigest: boolean;
};

const EMPTY_PROFILE: AuthProfile = {
  name: "",
  email: "",
  phone: "",
  website: "",
  instagram: "",
  bio: "",
  avatarUrl: "",
  provider: "",
  brandColor: "#2563eb",
  brandPalette: "deep-blue",
  brandFont: "inter",
  watermarkLabel: "4Tercios",
  watermarkOpacity: 0.08,
  watermarkDensity: 1,
  paymentsCountry: "",
  paymentsMethod: "",
  notifSales: true,
  notifMatches: true,
  notifWeeklyDigest: false,
};

let cachedProfile: AuthProfile | null = null;

function readText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function clampOpacity(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0.02, Math.min(0.45, value));
}

function clampDensity(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0.4, Math.min(2.2, value));
}

export function useAuthProfile() {
  const supabaseReady = useMemo(() => {
    try {
      getSupabaseBrowserClient();
      return true;
    } catch {
      return false;
    }
  }, []);

  const [profile, setProfile] = useState<AuthProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(() => supabaseReady);

  useEffect(() => {
    if (!supabaseReady) return;

    let mounted = true;

    async function loadProfile() {
      try {
        if (cachedProfile && mounted) {
          setProfile(cachedProfile);
        }
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;

        const user = data.user;
        const meta = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
        const identities = user?.identities ?? [];
        const provider = readText(user?.app_metadata?.provider);
        const googleIdentity = identities.find(
          (identity) => readText(identity.provider) === "google"
        );
        const googleIdentityData = (googleIdentity?.identity_data ?? {}) as Record<
          string,
          unknown
        >;
        const avatarUrl =
          readText(meta.avatar_url) ||
          readText(meta.picture) ||
          readText(googleIdentityData.avatar_url) ||
          readText(googleIdentityData.picture);

        const nextProfile = {
          name: readText(meta.business_name) || readText(meta.full_name),
          email: user?.email ?? "",
          phone: readText(meta.phone),
          website: readText(meta.website),
          instagram: readText(meta.instagram).replace(/^@/, ""),
          bio: readText(meta.bio),
          avatarUrl,
          provider,
          brandColor: normalizeHexColor(
            readText(meta.brand_color),
            EMPTY_PROFILE.brandColor
          ),
          brandPalette:
            (readText(meta.brand_palette) as BrandPaletteId) ||
            EMPTY_PROFILE.brandPalette,
          brandFont:
            (readText(meta.brand_font) as BrandFontId) || EMPTY_PROFILE.brandFont,
          watermarkLabel: readText(meta.watermark_label) || EMPTY_PROFILE.watermarkLabel,
          watermarkOpacity: clampOpacity(
            meta.watermark_opacity,
            EMPTY_PROFILE.watermarkOpacity
          ),
          watermarkDensity: clampDensity(
            meta.watermark_density,
            EMPTY_PROFILE.watermarkDensity
          ),
          paymentsCountry: readText(meta.payments_country),
          paymentsMethod: readText(meta.payments_method),
          notifSales:
            typeof meta.notif_sales === "boolean"
              ? meta.notif_sales
              : EMPTY_PROFILE.notifSales,
          notifMatches:
            typeof meta.notif_matches === "boolean"
              ? meta.notif_matches
              : EMPTY_PROFILE.notifMatches,
          notifWeeklyDigest:
            typeof meta.notif_weekly_digest === "boolean"
              ? meta.notif_weekly_digest
              : EMPTY_PROFILE.notifWeeklyDigest,
        };

        cachedProfile = nextProfile;
        setProfile(nextProfile);
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
