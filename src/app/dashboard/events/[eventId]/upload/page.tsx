import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon } from "@radix-ui/react-icons";

import { requirePhotographer } from "@/lib/server/auth";
import { getEventByIdForPhotographer } from "@/lib/server/events";
import { listPhotosForEvent } from "@/lib/server/photos";
import { Topbar } from "@/components/shell/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadStation } from "./upload-station";
import { PhotosListActions } from "./photos-list-actions";

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

  const totals = {
    uploaded: photos.length,
    ready: photos.filter((p) => p.status === "ready").length,
    processing: photos.filter((p) => p.status === "processing" || p.status === "uploaded").length,
    errors: photos.filter((p) => p.status === "error").length,
    faces: photos.reduce((acc, p) => acc + p.faces_count, 0),
  };

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
              <CardHeader>
                <CardTitle>Últimas fotos procesadas</CardTitle>
              </CardHeader>
              <CardContent>
                {photos.length === 0 ? (
                  <p className="text-sm text-zinc-700">
                    Aún no hay fotos. Sube algunas para empezar a detectar rostros.
                  </p>
                ) : (
                  <PhotosListActions photos={photos.slice(0, 12)} />
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
                  <p className="mt-1 text-sm font-semibold text-zinc-950">{event.name}</p>
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
                <div className="pt-2">
                  <Button asChild className="w-full">
                    <Link href={`/e/${event.slug}`}>Abrir página pública</Link>
                  </Button>
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
