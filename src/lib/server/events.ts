import "server-only";

import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { STORAGE_BUCKETS } from "@/lib/storage/paths";
import type { EventRow, EventStatus, EventType } from "@/lib/db/types";

export type ListEventsFilters = {
  search?: string | null;
  status?: EventStatus | "all" | null;
};

export type ListUpcomingEventsFilters = {
  search?: string | null;
  status?: EventStatus | "all" | null;
  type?: EventType | "all" | null;
  limit?: number;
};

export type ExpiredEventRow = EventRow & {
  expires_at: string;
  days_since_expired: number;
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function parseYmd(date: string) {
  const [year, month, day] = date.split("-").map((v) => Number(v));
  return new Date(year, (month || 1) - 1, day || 1);
}

function toYmd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function getAuthenticatedUserId(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>
) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Not authenticated");
  return data.user.id;
}

export async function listEventsForPhotographer(
  filters: ListEventsFilters = {}
): Promise<EventRow[]> {
  const supabase = await getSupabaseServerClient();
  const userId = await getAuthenticatedUserId(supabase);
  let query = supabase
    .from("events")
    .select("*")
    .eq("photographer_id", userId)
    .order("created_at", { ascending: false });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const search = filters.search?.trim();
  if (search) {
    const escaped = search.replace(/[\\%_,]/g, (m) => `\\${m}`);
    query = query.or(
      `name.ilike.%${escaped}%,city.ilike.%${escaped}%,venue.ilike.%${escaped}%,slug.ilike.%${escaped}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as EventRow[];
}

export async function listUpcomingEventsForPhotographer(
  filters: ListUpcomingEventsFilters = {}
): Promise<EventRow[]> {
  const supabase = await getSupabaseServerClient();
  const userId = await getAuthenticatedUserId(supabase);
  const today = new Date();
  const todayYmd = toYmd(today);

  let query = supabase
    .from("events")
    .select("*")
    .eq("photographer_id", userId)
    .gte("date", todayYmd)
    .order("date", { ascending: true })
    .order("created_at", { ascending: false });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.type && filters.type !== "all") {
    query = query.eq("type", filters.type);
  }

  const search = filters.search?.trim();
  if (search) {
    const escaped = search.replace(/[\\%_,]/g, (m) => `\\${m}`);
    query = query.or(
      `name.ilike.%${escaped}%,city.ilike.%${escaped}%,venue.ilike.%${escaped}%,slug.ilike.%${escaped}%`
    );
  }

  const take = Number.isFinite(filters.limit) ? Math.max(1, Number(filters.limit)) : 8;
  const { data, error } = await query.limit(take);
  if (error) throw error;
  return data as EventRow[];
}

export async function listExpiredEventsForPhotographer(
  filters: { search?: string | null } = {}
) {
  const events = await listEventsForPhotographer({
    search: filters.search ?? null,
    status: null,
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return events
    .map((event) => {
      const expiresDate = addDays(
        parseYmd(event.date),
        Math.max(0, event.online_days ?? 0)
      );
      const expiresMs = expiresDate.getTime();
      const daysSinceExpired = Math.max(
        0,
        Math.floor((today.getTime() - expiresMs) / 86400000)
      );
      return {
        ...event,
        expires_at: toYmd(expiresDate),
        days_since_expired: daysSinceExpired,
      } as ExpiredEventRow;
    })
    .filter((event) => {
      const expiredByDate = parseYmd(event.expires_at).getTime() < today.getTime();
      return expiredByDate || event.status === "Archivado";
    })
    .sort((a, b) => b.expires_at.localeCompare(a.expires_at));
}

export async function getEventByIdForPhotographer(id: string): Promise<EventRow | null> {
  const supabase = await getSupabaseServerClient();
  const userId = await getAuthenticatedUserId(supabase);
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("photographer_id", userId)
    .maybeSingle();
  return (data as EventRow | null) ?? null;
}

export async function getPublicEventBySlug(slug: string): Promise<EventRow | null> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("is_public", true)
    .in("status", ["Procesando", "Listo"])
    .maybeSingle();
  return (data as EventRow | null) ?? null;
}

export type PublicEventPresentation = EventRow & {
  photographers: {
    business_name: string;
    brand_color: string | null;
    theme_palette: string | null;
    theme_font: string | null;
    watermark_style: string | null;
    watermark_color: string | null;
    watermark_font: string | null;
    watermark_label: string | null;
    watermark_opacity: number | null;
    watermark_density: number | null;
  } | null;
};

export async function getPublicEventPresentationBySlug(
  slug: string
): Promise<PublicEventPresentation | null> {
  const supabase = await getSupabaseServerClient();

  const fullSelect =
    "*, photographers!events_photographer_id_fkey(business_name, brand_color, theme_palette, theme_font, watermark_style, watermark_color, watermark_font, watermark_label, watermark_opacity, watermark_density)";
  const opacitySelect =
    "*, photographers!events_photographer_id_fkey(business_name, brand_color, theme_palette, theme_font, watermark_style, watermark_color, watermark_font, watermark_label, watermark_opacity)";
  const labelSelect =
    "*, photographers!events_photographer_id_fkey(business_name, brand_color, theme_palette, theme_font, watermark_style, watermark_color, watermark_font, watermark_label)";
  const minimalSelect =
    "*, photographers!events_photographer_id_fkey(business_name, brand_color)";

  type FetchResult =
    | { ok: true; data: PublicEventPresentation | null }
    | { ok: false; code: string | undefined };

  async function tryFetch(select: string): Promise<FetchResult> {
    const res = await supabase
      .from("events")
      .select(select)
      .eq("slug", slug)
      .eq("is_public", true)
      .in("status", ["Procesando", "Listo"])
      .maybeSingle();
    if (!res.error) {
      return {
        ok: true,
        data: (res.data as PublicEventPresentation | null) ?? null,
      };
    }
    return { ok: false, code: (res.error as { code?: string }).code };
  }

  for (const select of [fullSelect, opacitySelect, labelSelect, minimalSelect]) {
    const res = await tryFetch(select);
    if (res.ok) return res.data;
    if (res.code !== "PGRST204") return null;
  }
  return null;
}

export type CreateEventInput = {
  name: string;
  type: EventType;
  date: string;
  city?: string;
  venue?: string;
  locationLat?: number;
  locationLng?: number;
  description?: string;
  pricePerPhotoHnl: number;
  onlineDays: number;
  whatsapp?: string;
  slug: string;
};

export async function createEvent(input: CreateEventInput): Promise<EventRow> {
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Not authenticated");

  const insert: Record<string, unknown> = {
    photographer_id: userData.user.id,
    slug: input.slug,
    name: input.name,
    type: input.type,
    date: input.date,
    city: input.city ?? null,
    venue: input.venue ?? null,
    description: input.description ?? null,
    price_per_photo_hnl: input.pricePerPhotoHnl,
    online_days: input.onlineDays,
    whatsapp: input.whatsapp ?? null,
    // Events start as private until the user explicitly publishes.
    is_public: false,
  };

  if (Number.isFinite(input.locationLat) && Number.isFinite(input.locationLng)) {
    insert.location_lat = input.locationLat;
    insert.location_lng = input.locationLng;
  }

  const { data, error } = await supabase
    .from("events")
    .insert(insert)
    .select("*")
    .single();
  if (error) throw error;
  return data as EventRow;
}

export async function updateEventStatus(id: string, status: EventStatus) {
  const supabase = await getSupabaseServerClient();
  const userId = await getAuthenticatedUserId(supabase);
  const { error } = await supabase
    .from("events")
    .update({ status })
    .eq("id", id)
    .eq("photographer_id", userId);
  if (error) throw error;
}

export type UpdateEventInput = {
  name?: string;
  type?: EventRow["type"];
  status?: EventRow["status"];
  date?: string;
  city?: string | null;
  venue?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  description?: string | null;
  pricePerPhotoHnl?: number;
  onlineDays?: number;
  whatsapp?: string | null;
  isPublic?: boolean;
};

export async function updateEvent(id: string, patch: UpdateEventInput) {
  const supabase = await getSupabaseServerClient();
  const userId = await getAuthenticatedUserId(supabase);
  const update: Record<string, unknown> = {};
  if (patch.name != null) update.name = patch.name;
  if (patch.type != null) update.type = patch.type;
  if (patch.status != null) update.status = patch.status;
  if (patch.date != null) update.date = patch.date;
  if (patch.city !== undefined) update.city = patch.city;
  if (patch.venue !== undefined) update.venue = patch.venue;
  if (patch.locationLat !== undefined) update.location_lat = patch.locationLat;
  if (patch.locationLng !== undefined) update.location_lng = patch.locationLng;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.pricePerPhotoHnl != null) update.price_per_photo_hnl = patch.pricePerPhotoHnl;
  if (patch.onlineDays != null) update.online_days = patch.onlineDays;
  if (patch.whatsapp !== undefined) update.whatsapp = patch.whatsapp;
  if (patch.isPublic != null) update.is_public = patch.isPublic;
  const { error } = await supabase
    .from("events")
    .update(update)
    .eq("id", id)
    .eq("photographer_id", userId);
  if (error) throw error;
}

export async function deleteEvent(id: string) {
  const supabase = await getSupabaseServerClient();
  const admin = getSupabaseServiceClient();
  const userId = await getAuthenticatedUserId(supabase);

  const { data: ownedEvent, error: eventErr } = await supabase
    .from("events")
    .select("id")
    .eq("id", id)
    .eq("photographer_id", userId)
    .maybeSingle();
  if (eventErr) throw eventErr;
  if (!ownedEvent) throw new Error("Event not found");

  // Fetch storage paths before deleting the event row (which cascades photos).
  const { data: photos, error: photosError } = await supabase
    .from("photos")
    .select("storage_path, thumb_path")
    .eq("event_id", id)
    .limit(2000);
  if (photosError) throw photosError;

  const originals = (photos ?? [])
    .map((p) => p.storage_path as string | null)
    .filter((v): v is string => typeof v === "string" && v.length > 0);
  const thumbs = (photos ?? [])
    .map((p) => p.thumb_path as string | null)
    .filter((v): v is string => typeof v === "string" && v.length > 0);

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id)
    .eq("photographer_id", userId);
  if (error) throw error;

  // Best-effort storage cleanup.
  if (originals.length > 0) {
    const res = await admin.storage.from(STORAGE_BUCKETS.originals).remove(originals);
    if (res.error) console.warn("Failed deleting originals:", res.error.message);
  }
  if (thumbs.length > 0) {
    const res = await admin.storage.from(STORAGE_BUCKETS.thumbs).remove(thumbs);
    if (res.error) console.warn("Failed deleting thumbs:", res.error.message);
  }
}

export async function reopenEvent(eventId: string) {
  const supabase = await getSupabaseServerClient();
  const userId = await getAuthenticatedUserId(supabase);
  const { data: event, error } = await supabase
    .from("events")
    .select("id, status, online_days, purged_at")
    .eq("id", eventId)
    .eq("photographer_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!event) throw new Error("Event not found");
  if ((event as { purged_at?: string | null }).purged_at) {
    throw new Error("Este evento ya fue depurado (sin fotos). No se puede reabrir.");
  }

  const currentDays = Number((event as { online_days?: unknown }).online_days ?? 14);
  const nextDays = Math.max(1, Math.min(60, currentDays + 30));

  const { error: updErr } = await supabase
    .from("events")
    .update({ status: "Listo", is_public: true, online_days: nextDays })
    .eq("id", eventId)
    .eq("photographer_id", userId);
  if (updErr) throw updErr;

  return { onlineDays: nextDays };
}

/** Aggregated counts for the dashboard home. */
export async function getPhotographerStats() {
  const supabase = await getSupabaseServerClient();
  const userId = await getAuthenticatedUserId(supabase);
  const eventsRes = await supabase
    .from("events")
    .select("id, status, is_public", { count: "exact" })
    .eq("photographer_id", userId);
  if (eventsRes.error) throw eventsRes.error;

  const events = eventsRes.data ?? [];
  const eventIds = events.map((event) => event.id as string);

  const [photosRes, ordersRes] =
    eventIds.length > 0
      ? await Promise.all([
          supabase
            .from("photos")
            .select("id, faces_count, status", { count: "exact" })
            .in("event_id", eventIds)
            .limit(1000),
          supabase
            .from("orders")
            .select("id, total_hnl, status, created_at, customer_name, photo_ids, event_id", {
              count: "exact",
            })
            .in("event_id", eventIds)
            .order("created_at", { ascending: false })
            .limit(50),
        ])
      : [{ data: [], error: null }, { data: [], error: null }];
  if (photosRes.error) throw photosRes.error;
  if (ordersRes.error) throw ordersRes.error;

  const photos = photosRes.data ?? [];
  const orders = ordersRes.data ?? [];

  const totals = {
    events: events.length,
    photos: photos.length,
    facesDetected: photos.reduce((acc, p) => acc + ((p.faces_count as number) ?? 0), 0),
    orders: orders.length,
    grossHnl: orders.reduce((acc, o) => acc + ((o.total_hnl as number) ?? 0), 0),
    paidHnl: orders
      .filter((o) => (o.status as string) === "paid")
      .reduce((acc, o) => acc + ((o.total_hnl as number) ?? 0), 0),
  };

  return { totals, recentOrders: orders.slice(0, 6) };
}
