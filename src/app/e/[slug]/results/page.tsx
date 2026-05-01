import Link from "next/link";
import { ArrowLeftIcon } from "@radix-ui/react-icons";

import { Brand } from "@/components/brand";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GalleryClient, type GalleryPhoto } from "@/components/search/gallery-client";
import { getPublicEventBySlug } from "@/lib/server/events";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { thumbPublicUrl } from "@/lib/storage/paths";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { formatHnl } from "@/lib/currency";

const DATE_FORMATTER = new Intl.DateTimeFormat("es-HN", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default async function ResultsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getPublicEventBySlug(slug);

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <Brand />
        <p className="mt-6 text-lg font-semibold text-zinc-950">Evento no encontrado</p>
        <p className="mt-2 text-sm text-zinc-700">Slug: {slug}</p>
        <div className="mt-6">
          <Button asChild variant="secondary">
            <Link href="/">Volver</Link>
          </Button>
        </div>
      </div>
    );
  }

  const admin = getSupabaseServiceClient();
  const env = getSupabaseEnv();
  const { data: photos } = await admin
    .from("photos")
    .select("id, thumb_path, faces_count")
    .eq("event_id", event.id)
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(120);

  const gallery: GalleryPhoto[] = (photos ?? [])
    .filter((p) => p.thumb_path)
    .map((p) => ({
      photoId: p.id as string,
      facesCount: (p.faces_count as number) ?? 0,
      thumbUrl: thumbPublicUrl(env.url, p.thumb_path as string),
    }));

  const dateStr = DATE_FORMATTER.format(new Date(`${event.date}T00:00:00`));
  const totalFaces = gallery.reduce((acc, p) => acc + p.facesCount, 0);

  return (
    <div className="flex min-h-full flex-col bg-zinc-50">
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Brand />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-zinc-950">{event.name}</p>
              <p className="text-xs text-zinc-500">Galería completa</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info">Watermark</Badge>
            <Button asChild variant="secondary">
              <Link href={`/e/${event.slug}`}>
                <ArrowLeftIcon /> Buscar con selfie
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="relative bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-800 px-6 py-8 text-white sm:px-8">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 40%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.06), transparent 50%)",
              }}
            />
            <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <Badge className="border-white/20 bg-white/10 text-white">Galería completa</Badge>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {event.name}
                </h1>
                <p className="mt-2 text-sm text-zinc-200">
                  {dateStr}
                  {event.city ? ` · ${event.city}` : ""}
                  {event.venue ? ` · ${event.venue}` : ""}
                </p>
                <p className="mt-1 text-xs text-zinc-300">
                  Selecciona las fotos que quieras comprar o solicita por WhatsApp.
                </p>
              </div>

              <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-auto">
                <KpiTile label="Fotos" value={gallery.length.toString()} />
                <KpiTile label="Rostros" value={totalFaces.toLocaleString("es-HN")} />
                <KpiTile label="Precio / foto" value={formatHnl(event.price_per_photo_hnl)} />
              </div>
            </div>
          </div>
          <div className="grid gap-3 border-t border-zinc-100 bg-zinc-50/70 px-6 py-3 text-xs text-zinc-600 sm:grid-cols-3 sm:px-8">
            <p>Click en una foto para seleccionarla</p>
            <p>Compra varias y agrega al pedido</p>
            <p>Pagar online o coordinar por WhatsApp</p>
          </div>
        </section>

        <div className="mt-8">
          {gallery.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center">
              <p className="text-base font-medium text-zinc-950">
                Aún no hay fotos publicadas
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                Vuelve a intentar pronto o usa la búsqueda con selfie.
              </p>
              <div className="mt-4">
                <Button asChild>
                  <Link href={`/e/${event.slug}`}>Ir a buscar con selfie</Link>
                </Button>
              </div>
            </div>
          ) : (
            <GalleryClient
              photos={gallery}
              eventSlug={event.slug}
              eventName={event.name}
              pricePerPhotoHnl={event.price_per_photo_hnl}
              whatsapp={event.whatsapp ?? ""}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
      <p className="text-[11px] uppercase tracking-wide text-zinc-300">{label}</p>
      <p className="mt-1 text-base font-semibold text-white tabular-nums">{value}</p>
    </div>
  );
}
