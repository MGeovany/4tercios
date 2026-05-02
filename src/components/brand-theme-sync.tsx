"use client";

import * as React from "react";

import { buildThemeCssVars } from "@/lib/branding";
import { useAuthProfile } from "@/lib/auth-profile";

export function BrandThemeSync() {
  const { profile } = useAuthProfile();

  React.useEffect(() => {
    const root = document.documentElement;
    const vars = buildThemeCssVars({
      paletteId: profile.brandPalette,
      primaryColor: profile.brandColor,
    });

    Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value));
    root.setAttribute("data-brand-font", profile.brandFont);
  }, [profile.brandColor, profile.brandFont, profile.brandPalette]);

  return null;
}
