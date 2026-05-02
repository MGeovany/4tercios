import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon } from "@radix-ui/react-icons";

import { requirePhotographer } from "@/lib/server/auth";
import { getEventByIdForPhotographer } from "@/lib/server/events";
import { listPhotosForEvent } from "@/lib/server/photos";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { STORAGE_BUCKETS, thumbPublicUrl } from "@/lib/storage/paths";
import { Topbar } from "@/components/shell/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadStation } from "./upload-station";
import { PhotosListActions } from "./photos-list-actions";
import { publishEventAction, saveEventAsDraftAction } from "./actions";
import { PublishEventButton, SaveDraftButton } from "./publish-buttons";
import { EventManageActions } from "./event-manage-actions";
import { ReprocessFailedButton } from "./reprocess-failed-button";

export default async function UploadPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  await requirePhotographer();

  const event = await getEventByIdForPhotographer(eventId);
  if (!event) notFound();
  if (event.photographer_id) {
    // RLS already enforces ownership; if photographer_id mismatch, redirect.
  }

  const photos = await listPhotosForEvent(eventId);
  if (photos == null) redirect("/dashboard");
  const photosForPreview = photos.slice(0, 12);

  const env = getSupabaseEnv();
  const admin = getSupabaseServiceClient();
  const previewEntries = await Promise.all(
    photosForPreview.map(async (photo) => {
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

  const totals = {
    uploaded: photos.length,
    ready: photos.filter((p) => p.status === "ready").length,
    processing: photos.filter((p) => p.status === "processing" || p.status === "uploaded").length,
    errors: photos.filter((p) => p.status === "error").length,
    faces: photos.reduce((acc, p) => acc + p.faces_count, 0),
  };
  const canPublish = totals.ready > 0 && totals.processing === 0;
  const isPublished = event.status === "Listo" && event.is_public;

  return (
    <>
      <Topbar
        title="Subida y procesamiento"
        right={
          <Button asChild variant="secondary" size="sm">
            <Link href="/dashboard">
              <ArrowLeftIcon /> Volver
            </Link>
          </Button>
        }
      />
      <div className="w-full px-4 py-4 sm:px-6 sm:py-6">
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="order-2 space-y-6 xl:order-1">
            <Card>
              <CardHeader>
                <CardTitle>Subir fotos</CardTitle>
              </CardHeader>
              <CardContent>
                <UploadStation eventId={event.id} initialTotals={totals} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Últimas fotos procesadas</CardTitle>
                {photos.length > 0 ? (
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/dashboard/events/${event.id}/gallery`}>
                      Ver galería completa ({photos.length})
                    </Link>
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent>
                {photos.length === 0 ? (
                  <p className="text-sm text-zinc-700">
                    Aún no hay fotos. Sube algunas para empezar a detectar rostros.
                  </p>
                ) : (
                  <PhotosListActions photos={photosForPreview} previewUrls={previewUrls} />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="order-1 space-y-6 xl:order-2">
            <Card>
              <CardHeader>
                <CardTitle>Resumen del evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-zinc-500">Evento</p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-sm font-semibold text-zinc-950">{event.name}</p>
                    <Badge variant={isPublished ? "success" : "neutral"}>
                      {isPublished ? "Publicado" : "Draft"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-zinc-700">
                    {event.city ?? "—"} · {event.date}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <KpiBox label="Fotos" value={totals.uploaded} />
                  <KpiBox label="Listas" value={totals.ready} />
                  <KpiBox label="Rostros" value={totals.faces} />
                  <KpiBox label="Errores" value={totals.errors} />
                </div>
                <div className="space-y-2 pt-2">
                  <form action={publishEventAction.bind(null, event.id, event.slug)}>
                    <PublishEventButton
                      disabled={!canPublish || isPublished}
                      isPublished={isPublished}
                    />
                  </form>
                  <p className="text-xs text-zinc-500">
                    {isPublished
                      ? "Tu evento ya esta visible en la web."
                      : canPublish
                        ? "Publica cuando estes listo para recibir visitas."
                        : "Se habilita cuando haya fotos listas y no queden fotos procesandose."}
                  </p>
                  <form action={saveEventAsDraftAction.bind(null, event.id)}>
                    <SaveDraftButton disabled={!isPublished} />
                  </form>
                  <ReprocessFailedButton eventId={event.id} failedCount={totals.errors} />
                  <div className="border-t border-zinc-100 pt-2">
                    <EventManageActions eventId={event.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

function KpiBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-950 tabular-nums">
        {value.toLocaleString("es-HN")}
      </p>
    </div>
  );
}
