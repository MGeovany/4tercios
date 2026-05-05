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
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const instagramHandle =
    typeof meta.instagram === "string" && meta.instagram.trim().length > 0
      ? `@${meta.instagram.trim().replace(/^@/, "")}`
      : null;
  const fullSelect =
    "id, business_name, whatsapp, brand_color, theme_palette, theme_font, watermark_style, watermark_color, watermark_font, watermark_label, watermark_opacity, watermark_density";
  const opacitySelect =
    "id, business_name, whatsapp, brand_color, theme_palette, theme_font, watermark_style, watermark_color, watermark_font, watermark_label, watermark_opacity";
  const labelSelect =
    "id, business_name, whatsapp, brand_color, theme_palette, theme_font, watermark_style, watermark_color, watermark_font, watermark_label";
  const legacySelect =
    "id, business_name, whatsapp, brand_color, theme_palette, theme_font, watermark_style, watermark_color, watermark_font";

  async function loadExistingPhotographer() {
    const existingQuery = await supabase
      .from("photographers")
      .select(fullSelect)
      .eq("id", user.id)
      .maybeSingle();

    if (!existingQuery.error) return existingQuery.data;
    if ((existingQuery.error as { code?: string }).code !== "PGRST204") return null;

    const opacityExisting = await supabase
      .from("photographers")
      .select(opacitySelect)
      .eq("id", user.id)
      .maybeSingle();
    if (!opacityExisting.error) return opacityExisting.data;
    if ((opacityExisting.error as { code?: string }).code !== "PGRST204") return null;

    const labelExisting = await supabase
      .from("photographers")
      .select(labelSelect)
      .eq("id", user.id)
      .maybeSingle();
    if (!labelExisting.error) return labelExisting.data;
    if ((labelExisting.error as { code?: string }).code !== "PGRST204") return null;

    const legacyExisting = await supabase
      .from("photographers")
      .select(legacySelect)
      .eq("id", user.id)
      .maybeSingle();
    return legacyExisting.data;
  }

  type ExistingPhotographer = NonNullable<
    Awaited<ReturnType<typeof loadExistingPhotographer>>
  >;

  const existing = await loadExistingPhotographer();

  if (existing) {
    // Keep older accounts aligned with username watermark when available.
    const currentLabel =
      (existing as { watermark_label?: string | null }).watermark_label?.trim() ?? "";
    const shouldBackfillLabel =
      !!instagramHandle &&
      (currentLabel.length === 0 || currentLabel.toLowerCase() === "4tercios");
    if (shouldBackfillLabel) {
      await supabase
        .from("photographers")
        .update({ watermark_label: instagramHandle })
        .eq("id", user.id);
      return {
        supabase,
        user,
        photographer: {
          ...(existing as ExistingPhotographer),
          watermark_label: instagramHandle,
        },
      };
    }
    return { supabase, user, photographer: existing };
  }

  const insert = {
    id: user.id,
    business_name:
      (typeof meta.business_name === "string" && meta.business_name) ||
      (typeof meta.full_name === "string" && meta.full_name) ||
      (user.email ? user.email.split("@")[0] : "Fotógrafo"),
    whatsapp: typeof meta.phone === "string" ? meta.phone : null,
    brand_color: typeof meta.brand_color === "string" ? meta.brand_color : "#18181b",
    theme_palette:
      typeof meta.brand_palette === "string" ? meta.brand_palette : "deep-blue",
    theme_font: typeof meta.brand_font === "string" ? meta.brand_font : "inter",
    watermark_style:
      typeof meta.watermark_style === "string" ? meta.watermark_style : "subtle",
    watermark_color:
      typeof meta.watermark_color === "string" ? meta.watermark_color : "#ffffff",
    watermark_font:
      typeof meta.watermark_font === "string" ? meta.watermark_font : "sans",
    watermark_label:
      typeof meta.watermark_label === "string" && meta.watermark_label.trim().length > 0
        ? meta.watermark_label
        : instagramHandle || "4Tercios",
    watermark_opacity:
      typeof meta.watermark_opacity === "number" &&
      Number.isFinite(meta.watermark_opacity)
        ? Math.max(0.02, Math.min(0.45, meta.watermark_opacity))
        : 0.08,
    watermark_density:
      typeof meta.watermark_density === "number" &&
      Number.isFinite(meta.watermark_density)
        ? Math.max(0.4, Math.min(2.2, meta.watermark_density))
        : 1,
  } as const;

  const admin = getSupabaseServiceClient();
  type PhotographerRow = Awaited<ReturnType<typeof loadExistingPhotographer>>;
  let created: PhotographerRow = null;
  let createError: { message?: string; code?: string } | null = null;

  const attempts: Array<{
    payload: Record<string, unknown>;
    select: string;
  }> = [];
  attempts.push({
    payload: insert as unknown as Record<string, unknown>,
    select: fullSelect,
  });
  const { watermark_density, ...opacityInsert } = insert;
  void watermark_density;
  attempts.push({
    payload: opacityInsert as unknown as Record<string, unknown>,
    select: opacitySelect,
  });
  const { watermark_opacity, ...labelInsert } = opacityInsert;
  void watermark_opacity;
  attempts.push({
    payload: labelInsert as unknown as Record<string, unknown>,
    select: labelSelect,
  });
  const { watermark_label, ...legacyInsert } = labelInsert;
  void watermark_label;
  attempts.push({
    payload: legacyInsert as unknown as Record<string, unknown>,
    select: legacySelect,
  });

  for (const attempt of attempts) {
    const res = await admin
      .from("photographers")
      .upsert(attempt.payload, { onConflict: "id" })
      .select(attempt.select)
      .single();

    if (!res.error && res.data) {
      created = res.data as unknown as PhotographerRow;
      createError = null;
      break;
    }

    const code = (res.error as { code?: string } | null)?.code;
    createError = (res.error as { message?: string; code?: string } | null) ?? null;
    if (code !== "PGRST204") {
      break;
    }
  }

  // Final race-safe read after upsert attempts.
  if (!created) {
    const raced = await loadExistingPhotographer();
    if (raced) {
      created = raced;
      createError = null;
    }
  }

  if (createError || !created) {
    throw new Error(
      `Failed to create photographer row: ${createError?.message ?? "unknown"}`
    );
  }

  return { supabase, user, photographer: created };
}

export async function getOptionalPhotographer() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
