import "server-only";

import { randomUUID } from "node:crypto";

import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { STORAGE_BUCKETS, originalPath, thumbPath } from "@/lib/storage/paths";
import { buildWatermarkedThumb } from "@/lib/imaging/thumb";
import { getFaceProvider, toPgVector } from "@/lib/face";
import type { PhotoRow } from "@/lib/db/types";

const PROCESS_TIMEOUT_MS = 60_000;

export async function listPhotosForEvent(eventId: string): Promise<PhotoRow[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw toError(error, "Failed to list photos");
  return data as PhotoRow[];
}

/**
 * Register a photo row before the client uploads to Storage.
 * The client then uploads bytes directly to `storage_path` and calls processPhoto().
 */
export async function registerPhoto(input: {
  eventId: string;
  filename: string;
  ext: string;
  bytes: number;
}): Promise<{ photo: PhotoRow; bucket: string; uploadToken: string }> {
  const supabase = await getSupabaseServerClient();
  const admin = getSupabaseServiceClient();
  // Verify the caller owns this event (RLS enforces, but we want a clean error).
  const { data: event, error: evtError } = await supabase
    .from("events")
    .select("id")
    .eq("id", input.eventId)
    .maybeSingle();
  if (evtError || !event) throw new Error("Event not found or not yours");

  const photoId = randomUUID();
  const path = originalPath(input.eventId, photoId, input.ext);

  const { data, error } = await supabase
    .from("photos")
    .insert({
      id: photoId,
      event_id: input.eventId,
      storage_path: path,
      filename: input.filename,
      bytes: input.bytes,
      status: "uploaded",
    })
    .select("*")
    .single();
  if (error) throw toError(error, "Failed to register photo");

  // Bump event status to Subiendo when first photo lands.
  await supabase
    .from("events")
    .update({ status: "Subiendo" })
    .eq("id", input.eventId)
    .in("status", ["Borrador"]);

  const signedUpload = await admin.storage
    .from(STORAGE_BUCKETS.originals)
    .createSignedUploadUrl(path, { upsert: false });
  if (signedUpload.error || !signedUpload.data?.token) {
    throw new Error(`Signed upload URL failed: ${signedUpload.error?.message ?? "No token"}`);
  }

  return {
    photo: data as PhotoRow,
    bucket: STORAGE_BUCKETS.originals,
    uploadToken: signedUpload.data.token,
  };
}

/**
 * Run face detection + thumbnail generation for a single photo.
 * Idempotent: if status is already 'ready', returns immediately.
 */
export async function processPhoto(photoId: string): Promise<PhotoRow> {
  const supabase = await getSupabaseServerClient();
  const { data: photo, error } = await supabase
    .from("photos")
    .select("*, events!photos_event_id_fkey(id, photographer_id)")
    .eq("id", photoId)
    .maybeSingle();
  if (error) throw toError(error, "Failed to load photo");
  if (!photo) throw new Error("Photo not found");

  const row = photo as PhotoRow & { events: { photographer_id: string } };
  if (row.status === "ready") return row;

  // Mark as processing. RLS guarantees only the owner can do this.
  const { error: processingStatusError } = await supabase
    .from("photos")
    .update({ status: "processing" })
    .eq("id", photoId);
  if (processingStatusError) {
    throw toError(processingStatusError, "Failed to mark photo as processing");
  }

  const admin = getSupabaseServiceClient();

  try {
    // 1. Download original.
    const original = await admin.storage.from(STORAGE_BUCKETS.originals).download(row.storage_path);
    if (original.error || !original.data) {
      throw new Error(`Storage download failed: ${original.error?.message}`);
    }
    const buf = Buffer.from(await original.data.arrayBuffer());

    // 2. Get a short-lived signed URL so Replicate can fetch the image.
    const signed = await admin.storage
      .from(STORAGE_BUCKETS.originals)
      .createSignedUrl(row.storage_path, 600);
    if (signed.error || !signed.data) {
      throw new Error(`Signed URL failed: ${signed.error?.message}`);
    }

    // 3. Face detection (with timeout).
    const provider = getFaceProvider();
    const faces = await withTimeout(
      provider.detect({ imageUrl: signed.data.signedUrl }),
      PROCESS_TIMEOUT_MS
    );

    // 4. Thumbnail (parallel-friendly).
    const { data: photographer } = await admin
      .from("photographers")
      .select("business_name")
      .eq("id", row.events.photographer_id)
      .maybeSingle();
    const brandLabel = (photographer?.business_name as string | undefined) || "4tercios";
    const thumb = await buildWatermarkedThumb(buf, brandLabel);

    const tPath = thumbPath(row.event_id, row.id);
    const thumbUpload = await admin.storage
      .from(STORAGE_BUCKETS.thumbs)
      .upload(tPath, thumb.webp, { contentType: "image/webp", upsert: true });
    if (thumbUpload.error) {
      throw new Error(`Thumb upload failed: ${thumbUpload.error.message}`);
    }

    // 5. Persist faces.
    if (faces.length > 0) {
      const facesRows = faces.map((f) => ({
        photo_id: row.id,
        event_id: row.event_id,
        bbox: f.bbox,
        quality: f.quality,
        embedding: toPgVector(f.embedding),
      }));
      const { error: facesError } = await admin.from("faces").insert(facesRows);
      if (facesError) throw new Error(`Faces insert failed: ${facesError.message}`);
    }

    const updates = {
      status: "ready" as const,
      thumb_path: tPath,
      width: thumb.width || null,
      height: thumb.height || null,
      faces_count: faces.length,
      processed_at: new Date().toISOString(),
      error_message: null,
    };
    const { data: updated, error: updateError } = await admin
      .from("photos")
      .update(updates)
      .eq("id", row.id)
      .select("*")
      .single();
    if (updateError) throw toError(updateError, "Failed to persist processed photo");

    // Roll up event status when first ready photo arrives.
    await admin
      .from("events")
      .update({ status: "Procesando" })
      .eq("id", row.event_id)
      .in("status", ["Subiendo", "Borrador"]);

    return updated as PhotoRow;
  } catch (err) {
    const message = toError(err, "Photo processing failed").message;
    await admin.from("photos").update({ status: "error", error_message: message }).eq("id", row.id);
    throw new Error(message);
  }
}

/**
 * Delete one photo belonging to the authenticated photographer.
 * Removes DB row first (RLS enforced), then attempts to delete storage objects.
 */
export async function deletePhoto(photoId: string): Promise<{ id: string }> {
  const supabase = await getSupabaseServerClient();
  const admin = getSupabaseServiceClient();

  const { data: photo, error: fetchError } = await supabase
    .from("photos")
    .select("id, storage_path, thumb_path")
    .eq("id", photoId)
    .maybeSingle();
  if (fetchError) throw toError(fetchError, "Failed to fetch photo");
  if (!photo) throw new Error("Photo not found");

  const storagePath = photo.storage_path as string;
  const thumbStoragePath = (photo.thumb_path as string | null) ?? null;

  const { error: deleteError } = await supabase.from("photos").delete().eq("id", photoId);
  if (deleteError) throw toError(deleteError, "Failed to delete photo");

  // Best-effort storage cleanup after successful row delete.
  const originalsDelete = await admin.storage.from(STORAGE_BUCKETS.originals).remove([storagePath]);
  if (originalsDelete.error) {
    console.warn("Failed deleting original from storage:", originalsDelete.error.message);
  }
  if (thumbStoragePath) {
    const thumbsDelete = await admin.storage
      .from(STORAGE_BUCKETS.thumbs)
      .remove([thumbStoragePath]);
    if (thumbsDelete.error) {
      console.warn("Failed deleting thumb from storage:", thumbsDelete.error.message);
    }
  }

  return { id: photoId };
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
    ),
  ]);
}

function toError(input: unknown, fallback: string): Error {
  if (input instanceof Error) return input;
  if (!input || typeof input !== "object") return new Error(fallback);

  const maybe = input as {
    message?: unknown;
    details?: unknown;
    hint?: unknown;
    code?: unknown;
  };
  const parts = [maybe.message, maybe.details, maybe.hint, maybe.code]
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim());

  return new Error(parts.length > 0 ? parts.join(" | ") : fallback);
}
