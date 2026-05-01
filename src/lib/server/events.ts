import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { EventRow, EventStatus, EventType } from "@/lib/db/types";

export async function listEventsForPhotographer(): Promise<EventRow[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as EventRow[];
}

export async function getEventByIdForPhotographer(id: string): Promise<EventRow | null> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
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
  };

  if (Number.isFinite(input.locationLat) && Number.isFinite(input.locationLng)) {
    insert.location_lat = input.locationLat;
    insert.location_lng = input.locationLng;
  }

  const { data, error } = await supabase.from("events").insert(insert).select("*").single();
  if (error) throw error;
  return data as EventRow;
}

export async function updateEventStatus(id: string, status: EventStatus) {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("events").update({ status }).eq("id", id);
  if (error) throw error;
}

export type UpdateEventInput = {
  name?: string;
  type?: EventRow["type"];
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
  const update: Record<string, unknown> = {};
  if (patch.name != null) update.name = patch.name;
  if (patch.type != null) update.type = patch.type;
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
  const { error } = await supabase.from("events").update(update).eq("id", id);
  if (error) throw error;
}

export async function deleteEvent(id: string) {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

/** Aggregated counts for the dashboard home. */
export async function getPhotographerStats() {
  const supabase = await getSupabaseServerClient();
  const [eventsRes, photosRes, ordersRes] = await Promise.all([
    supabase.from("events").select("id, status, is_public", { count: "exact" }),
    supabase.from("photos").select("id, faces_count, status", { count: "exact" }).limit(1000),
    supabase
      .from("orders")
      .select("id, total_hnl, status, created_at, customer_name, photo_ids, event_id", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const events = eventsRes.data ?? [];
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
