"use client";

import { useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  type BrandFontId,
  type BrandPaletteId,
  normalizeHexColor,
  type WatermarkFontId,
  type WatermarkStyle,
} from "@/lib/branding";

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
  watermarkStyle: WatermarkStyle;
  watermarkColor: string;
  watermarkFont: WatermarkFontId;
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
  watermarkStyle: "subtle",
  watermarkColor: "#ffffff",
  watermarkFont: "sans",
  paymentsCountry: "",
  paymentsMethod: "",
  notifSales: true,
  notifMatches: true,
  notifWeeklyDigest: false,
};

function readText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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
        const googleIdentityData = (googleIdentity?.identity_data ?? {}) as Record<string, unknown>;
        const avatarUrl =
          readText(meta.avatar_url) ||
          readText(meta.picture) ||
          readText(googleIdentityData.avatar_url) ||
          readText(googleIdentityData.picture);

        setProfile({
          name: readText(meta.business_name) || readText(meta.full_name),
          email: user?.email ?? "",
          phone: readText(meta.phone),
          website: readText(meta.website),
          instagram: readText(meta.instagram).replace(/^@/, ""),
          bio: readText(meta.bio),
          avatarUrl,
          provider,
          brandColor: normalizeHexColor(readText(meta.brand_color), EMPTY_PROFILE.brandColor),
          brandPalette:
            (readText(meta.brand_palette) as BrandPaletteId) || EMPTY_PROFILE.brandPalette,
          brandFont: (readText(meta.brand_font) as BrandFontId) || EMPTY_PROFILE.brandFont,
          watermarkStyle:
            (readText(meta.watermark_style) as WatermarkStyle) || EMPTY_PROFILE.watermarkStyle,
          watermarkColor: normalizeHexColor(
            readText(meta.watermark_color),
            EMPTY_PROFILE.watermarkColor
          ),
          watermarkFont:
            (readText(meta.watermark_font) as WatermarkFontId) || EMPTY_PROFILE.watermarkFont,
          paymentsCountry: readText(meta.payments_country),
          paymentsMethod: readText(meta.payments_method),
          notifSales:
            typeof meta.notif_sales === "boolean" ? meta.notif_sales : EMPTY_PROFILE.notifSales,
          notifMatches:
            typeof meta.notif_matches === "boolean"
              ? meta.notif_matches
              : EMPTY_PROFILE.notifMatches,
          notifWeeklyDigest:
            typeof meta.notif_weekly_digest === "boolean"
              ? meta.notif_weekly_digest
              : EMPTY_PROFILE.notifWeeklyDigest,
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
