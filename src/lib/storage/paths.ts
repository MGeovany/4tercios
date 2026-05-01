// Storage layout — keep in sync with policies in supabase/migrations/0002_storage.sql.
// Path layout: <event_id>/<photo_id>.<ext>

export const STORAGE_BUCKETS = {
  originals: "photos-original",
  thumbs: "photo-thumbs",
  selfies: "selfies",
} as const;

export function originalPath(eventId: string, photoId: string, ext: string) {
  return `${eventId}/${photoId}.${normaliseExt(ext)}`;
}

export function thumbPath(eventId: string, photoId: string) {
  return `${eventId}/${photoId}.webp`;
}

export function selfiePath(eventId: string, queryId: string) {
  return `${eventId}/${queryId}.jpg`;
}

export function thumbPublicUrl(supabaseUrl: string, path: string) {
  return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKETS.thumbs}/${path}`;
}

function normaliseExt(name: string) {
  const lower = name.toLowerCase();
  const cleaned = lower.replace(/^\.+/, "").split(".").pop() ?? "jpg";
  if (cleaned === "jpeg") return "jpg";
  if (["heic", "heif"].includes(cleaned)) return "heic";
  if (["png", "webp", "jpg"].includes(cleaned)) return cleaned;
  return "jpg";
}
