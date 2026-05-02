import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@radix-ui/react-icons";

import { requirePhotographer } from "@/lib/server/auth";
import { getEventByIdForPhotographer } from "@/lib/server/events";
import { listPhotosForEvent } from "@/lib/server/photos";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { STORAGE_BUCKETS, thumbPublicUrl } from "@/lib/storage/paths";
import { Topbar } from "@/components/shell/topbar";
import { Button } from "@/components/ui/button";
import { GalleryManager } from "./gallery-manager";

export default async function GalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { eventId } = await params;
  const sp = await searchParams;
  await requirePhotographer();

  const event = await getEventByIdForPhotographer(eventId);
  if (!event) notFound();

  const filterParam =
    typeof sp.filter === "string" ? sp.filter : Array.isArray(sp.filter) ? sp.filter[0] : "all";
  const filter: "all" | "ready" | "error" | "processing" =
    filterParam === "ready" || filterParam === "error" || filterParam === "processing"
      ? filterParam
      : "all";

  const photos = await listPhotosForEvent(eventId);
  const filtered = photos.filter((p) => {
    if (filter === "all") return true;
    if (filter === "ready") return p.status === "ready";
    if (filter === "error") return p.status === "error";
    return p.status === "processing" || p.status === "uploaded";
  });

  const env = getSupabaseEnv();
  const admin = getSupabaseServiceClient();
  const previewEntries = await Promise.all(
    filtered.map(async (photo) => {
      if (photo.thumb_path) {
        return [photo.id, thumbPublicUrl(env.url, photo.thumb_path)] as const;
      }
      const signed = await admin.storage
        .from(STORAGE_BUCKETS.originals)
        .createSignedUrl(photo.storage_path, 3600);
      return [photo.id, signed.data?.signedUrl ?? null] as const;
    })
  );
  const previewUrls = Object.fromEntries(previewEntries);

  const counts = {
    all: photos.length,
    ready: photos.filter((p) => p.status === "ready").length,
    error: photos.filter((p) => p.status === "error").length,
    processing: photos.filter((p) => p.status === "processing" || p.status === "uploaded").length,
  };

  return (
    <>
      <Topbar
        title={`Galería · ${event.name}`}
        subtitle={`${counts.all} fotos`}
        right={
          <Button asChild variant="secondary" size="sm">
            <Link href={`/dashboard/events/${event.id}/upload`}>
              <ArrowLeftIcon /> Volver a subida
            </Link>
          </Button>
        }
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <GalleryManager
          eventId={event.id}
          photos={filtered}
          previewUrls={previewUrls}
          counts={counts}
          filter={filter}
        />
      </div>
    </>
  );
}
