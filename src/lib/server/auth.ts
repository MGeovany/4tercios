import "server-only";

import { redirect } from "next/navigation";

import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

/**
 * Resolve the currently signed-in photographer.
 * Creates the matching row in `photographers` on first call so RLS-dependent queries work.
 */
export async function requirePhotographer() {
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) redirect("/login");

  const user = userData.user;
  const { data: existing } = await supabase
    .from("photographers")
    .select(
      "id, business_name, whatsapp, brand_color, theme_palette, theme_font, watermark_style, watermark_color, watermark_font"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return { supabase, user, photographer: existing };
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const insert = {
    id: user.id,
    business_name:
      (typeof meta.business_name === "string" && meta.business_name) ||
      (typeof meta.full_name === "string" && meta.full_name) ||
      (user.email ? user.email.split("@")[0] : "Fotógrafo"),
    whatsapp: typeof meta.phone === "string" ? meta.phone : null,
    brand_color: typeof meta.brand_color === "string" ? meta.brand_color : "#18181b",
    theme_palette: typeof meta.brand_palette === "string" ? meta.brand_palette : "deep-blue",
    theme_font: typeof meta.brand_font === "string" ? meta.brand_font : "inter",
    watermark_style: typeof meta.watermark_style === "string" ? meta.watermark_style : "subtle",
    watermark_color: typeof meta.watermark_color === "string" ? meta.watermark_color : "#ffffff",
    watermark_font: typeof meta.watermark_font === "string" ? meta.watermark_font : "sans",
  } as const;

  const admin = getSupabaseServiceClient();
  const { data: created, error: createError } = await admin
    .from("photographers")
    .insert(insert)
    .select(
      "id, business_name, whatsapp, brand_color, theme_palette, theme_font, watermark_style, watermark_color, watermark_font"
    )
    .single();
  if (createError || !created) {
    throw new Error(`Failed to create photographer row: ${createError?.message ?? "unknown"}`);
  }

  return { supabase, user, photographer: created };
}

export async function getOptionalPhotographer() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
