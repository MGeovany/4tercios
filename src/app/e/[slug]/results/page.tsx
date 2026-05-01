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

  return (
    <div className="flex min-h-full flex-col bg-white">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Brand />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-zinc-950">{event.name}</p>
              <p className="text-xs text-zinc-700">Galería completa</p>
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
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
          Todas las fotos del evento
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-700">
          Selecciona las que quieras comprar o solicita por WhatsApp.
        </p>

        <div className="mt-6">
          {gallery.length === 0 ? (
            <p className="text-sm text-zinc-700">
              Aún no hay fotos publicadas. Vuelve a intentar pronto.
            </p>
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
