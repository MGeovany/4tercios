import "server-only";

import { randomUUID, createHash } from "node:crypto";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { STORAGE_BUCKETS, selfiePath, thumbPublicUrl } from "@/lib/storage/paths";
import { getFaceProvider, toPgVector } from "@/lib/face";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { EventRow } from "@/lib/db/types";

export type SelfieMatch = {
  photoId: string;
  score: number;
  facesCount: number;
  thumbUrl: string;
};

export type SelfieSearchResult = {
  queryId: string;
  matches: SelfieMatch[];
  bestMatchScore: number | null;
  totalCandidates: number;
};

const MIN_SCORE = Number(process.env.SELFIE_MIN_SCORE) || 0.45;
const MAX_RESULTS = 60;

export async function searchEventBySelfie(opts: {
  event: EventRow;
  selfieBytes: Buffer;
  contentType: string;
  ip?: string | null;
}): Promise<SelfieSearchResult> {
  const admin = getSupabaseServiceClient();
  const env = getSupabaseEnv();

  // 1. Persist selfie to bucket so Replicate can fetch via signed URL.
  const queryId = randomUUID();
  const path = selfiePath(opts.event.id, queryId);
  const upload = await admin.storage
    .from(STORAGE_BUCKETS.selfies)
    .upload(path, opts.selfieBytes, {
      contentType: opts.contentType || "image/jpeg",
      upsert: true,
    });
  if (upload.error) throw new Error(`Selfie upload failed: ${upload.error.message}`);

  const signed = await admin.storage
    .from(STORAGE_BUCKETS.selfies)
    .createSignedUrl(path, 300);
  if (signed.error || !signed.data) {
    throw new Error(`Selfie signed URL failed: ${signed.error?.message}`);
  }

  // 2. Get the selfie embedding (highest-quality face).
  const provider = getFaceProvider();
  const face = await provider.embedBestFace({ imageUrl: signed.data.signedUrl });
  if (!face) {
    await admin.storage.from(STORAGE_BUCKETS.selfies).remove([path]);
    throw new Error(
      "No detectamos un rostro en tu selfie. Acércate a la cámara y vuelve a intentar."
    );
  }

  // 3. Save query so photographers see analytics (without persisting raw selfie long-term).
  const ipHash = opts.ip ? createHash("sha256").update(opts.ip).digest("hex") : null;
  await admin.from("selfie_queries").insert({
    id: queryId,
    event_id: opts.event.id,
    embedding: toPgVector(face.embedding),
    ip_hash: ipHash,
  });

  // 4. Vector search.
  const { data: rows, error: rpcError } = await admin.rpc("search_photos_by_embedding", {
    p_event_id: opts.event.id,
    p_embedding: toPgVector(face.embedding),
    p_limit: MAX_RESULTS,
    p_min_score: MIN_SCORE,
  });
  if (rpcError) throw new Error(`Search RPC failed: ${rpcError.message}`);

  type Row = { photo_id: string; score: number; faces_count: number };
  const results = (rows as Row[] | null) ?? [];

  // 5. Hydrate thumb paths in one query.
  const photoIds = results.map((r) => r.photo_id);
  const thumbsByPhoto = new Map<string, string>();
  if (photoIds.length > 0) {
    const { data: photos } = await admin
      .from("photos")
      .select("id, thumb_path")
      .in("id", photoIds);
    for (const p of photos ?? []) {
      if (p.thumb_path) thumbsByPhoto.set(p.id as string, p.thumb_path as string);
    }
  }

  // 6. Schedule selfie deletion (best-effort, non-blocking).
  void admin.storage.from(STORAGE_BUCKETS.selfies).remove([path]);

  const matches: SelfieMatch[] = results
    .map((r) => {
      const path = thumbsByPhoto.get(r.photo_id);
      if (!path) return null;
      return {
        photoId: r.photo_id,
        score: r.score,
        facesCount: r.faces_count,
        thumbUrl: thumbPublicUrl(env.url, path),
      };
    })
    .filter((m): m is SelfieMatch => m !== null);

  return {
    queryId,
    matches,
    bestMatchScore: matches[0]?.score ?? null,
    totalCandidates: results.length,
  };
}
