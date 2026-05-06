import "server-only";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { thumbPublicUrl } from "@/lib/storage/paths";
import { resolvePublicUsername } from "@/lib/public-event-path";

type PublicPhotographer = {
  id: string;
  business_name: string;
  whatsapp: string | null;
  brand_color: string | null;
  created_at: string;
};

type PublicEvent = {
  id: string;
  slug: string;
  name: string;
  date: string;
  city: string | null;
  venue: string | null;
  price_per_photo_hnl: number;
  online_days: number;
  status: string;
  is_public: boolean;
};

export type PublicProfileEventCard = PublicEvent & {
  photosReady: number;
  thumbUrl: string | null;
  expiresAt: string;
};

export type PublicPhotographerProfile = {
  photographer: PublicPhotographer;
  username: string;
  activeEvents: PublicProfileEventCard[];
  expiredEvents: PublicProfileEventCard[];
};

const ACTIVE_STATUSES = new Set(["Listo", "Procesando"]);

function addDaysYmd(dateYmd: string, days: number) {
  const [y, m, d] = dateYmd.split("-").map(Number);
  const next = new Date(y, (m || 1) - 1, d || 1);
  next.setDate(next.getDate() + Math.max(0, days));
  const yy = next.getFullYear();
  const mm = String(next.getMonth() + 1).padStart(2, "0");
  const dd = String(next.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export async function getPublicPhotographerProfileByUsername(
  username: string
): Promise<PublicPhotographerProfile | null> {
  const normalizedUsername = resolvePublicUsername(username);
  const supabase = getSupabaseServiceClient();
  const maybeNeedle = normalizedUsername.replace(/-/g, "%");
  const { data: photographers, error: photographerErr } = await supabase
    .from("photographers")
    .select("id, business_name, whatsapp, brand_color, created_at")
    .ilike("business_name", `%${maybeNeedle}%`)
    .limit(100);
  if (photographerErr) throw photographerErr;

  const photographer =
    (photographers ?? []).find(
      (row) => resolvePublicUsername((row as PublicPhotographer).business_name) === normalizedUsername
    ) ?? null;
  if (!photographer) return null;

  const { data: events, error: eventsErr } = await supabase
    .from("events")
    .select("id, slug, name, date, city, venue, price_per_photo_hnl, online_days, status, is_public")
    .eq("photographer_id", (photographer as PublicPhotographer).id)
    .eq("is_public", true)
    .order("date", { ascending: false })
    .limit(300);
  if (eventsErr) throw eventsErr;

  const baseEvents = (events ?? []) as PublicEvent[];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const withExpiry = baseEvents.map((event) => {
    const expiresAt = addDaysYmd(event.date, event.online_days ?? 0);
    return { ...event, expiresAt };
  });

  const active = withExpiry.filter((event) => {
    const expiresDate = new Date(`${event.expiresAt}T00:00:00`);
    return ACTIVE_STATUSES.has(event.status) && expiresDate.getTime() >= today.getTime();
  });

  const expired = withExpiry.filter((event) => {
    const expiresDate = new Date(`${event.expiresAt}T00:00:00`);
    const isExpiredByDate = expiresDate.getTime() < today.getTime();
    return isExpiredByDate || event.status === "Archivado";
  });

  const activeIds = active.map((event) => event.id);
  const env = getSupabaseEnv();
  const photoCounts = new Map<string, number>();
  const firstThumbByEvent = new Map<string, string>();

  if (activeIds.length > 0) {
    const { data: photos, error: photosErr } = await supabase
      .from("photos")
      .select("event_id, thumb_path")
      .in("event_id", activeIds)
      .eq("status", "ready")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (photosErr) throw photosErr;
    for (const photo of photos ?? []) {
      const eventId = photo.event_id as string;
      photoCounts.set(eventId, (photoCounts.get(eventId) ?? 0) + 1);
      if (!firstThumbByEvent.has(eventId) && typeof photo.thumb_path === "string") {
        firstThumbByEvent.set(eventId, thumbPublicUrl(env.url, photo.thumb_path));
      }
    }
  }

  const toCard = (event: (typeof withExpiry)[number]): PublicProfileEventCard => ({
    ...event,
    photosReady: photoCounts.get(event.id) ?? 0,
    thumbUrl: firstThumbByEvent.get(event.id) ?? null,
  });

  return {
    photographer: photographer as PublicPhotographer,
    username: normalizedUsername,
    activeEvents: active.map(toCard),
    expiredEvents: expired.map(toCard),
  };
}

export async function getPhotographerLikeSummary(
  photographerId: string,
  viewerKey?: string | null
) {
  const supabase = getSupabaseServiceClient();
  const { data: likesRows, error } = await supabase
    .from("photographer_profile_likes")
    .select("viewer_key, clap_count")
    .eq("photographer_id", photographerId);
  if (error) throw error;

  let totalClaps = 0;
  let myClaps = 0;
  for (const row of likesRows ?? []) {
    const claps = Number((row as { clap_count?: unknown }).clap_count ?? 0);
    totalClaps += Number.isFinite(claps) ? claps : 0;
    if (viewerKey && (row as { viewer_key?: string }).viewer_key === viewerKey) {
      myClaps = claps;
    }
  }
  return { totalClaps, myClaps };
}

export async function incrementPhotographerLike(
  photographerId: string,
  viewerKey: string
) {
  const supabase = getSupabaseServiceClient();
  const { data: existing, error: existingErr } = await supabase
    .from("photographer_profile_likes")
    .select("clap_count")
    .eq("photographer_id", photographerId)
    .eq("viewer_key", viewerKey)
    .maybeSingle();
  if (existingErr) throw existingErr;

  const current = Number((existing as { clap_count?: unknown } | null)?.clap_count ?? 0);
  const nextClaps = Math.min(50, current + 1);
  if (current >= 50) {
    const summary = await getPhotographerLikeSummary(photographerId, viewerKey);
    return { ...summary, reachedLimit: true };
  }

  if (existing) {
    const { error: updateErr } = await supabase
      .from("photographer_profile_likes")
      .update({ clap_count: nextClaps })
      .eq("photographer_id", photographerId)
      .eq("viewer_key", viewerKey);
    if (updateErr) throw updateErr;
  } else {
    const { error: insertErr } = await supabase.from("photographer_profile_likes").insert({
      photographer_id: photographerId,
      viewer_key: viewerKey,
      clap_count: 1,
    });
    if (insertErr) throw insertErr;
  }

  const summary = await getPhotographerLikeSummary(photographerId, viewerKey);
  return { ...summary, reachedLimit: summary.myClaps >= 50 };
}

