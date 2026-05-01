import Link from "next/link";

import { Brand } from "@/components/brand";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SelfieSearch } from "@/components/search/selfie-search";
import { getPublicEventBySlug } from "@/lib/server/events";
import { formatHnl } from "@/lib/local-store";

export default async function PublicEventPage({ params }: { params: Promise<{ slug: string }> }) {
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

  const dateStr = new Intl.DateTimeFormat("es-HN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${event.date}T00:00:00`));

  return (
    <div className="flex min-h-full flex-col bg-white">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-8">
          <Brand />
          <Button asChild variant="secondary">
            <Link href="/dashboard">Soy fotógrafo</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 lg:px-8">
        <div className="grid gap-3 sm:flex sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-zinc-700">Galería pública</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              {event.name}
            </h1>
            <p className="mt-2 text-sm text-zinc-700">
              {dateStr}
              {event.city ? ` · ${event.city}` : ""}
              {event.venue ? ` · ${event.venue}` : ""}
            </p>
          </div>
          <Card className="w-fit">
            <CardContent className="flex items-center gap-4 p-4">
              <div>
                <p className="text-xs text-zinc-500">Precio por foto</p>
                <p className="text-base font-semibold text-zinc-950">
                  {formatHnl(event.price_per_photo_hnl)}
                </p>
              </div>
              <div className="h-8 w-px bg-zinc-200" />
              <div>
                <p className="text-xs text-zinc-500">Estado</p>
                <p className="text-base font-semibold text-zinc-950">{event.status}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <SelfieSearch
            slug={event.slug}
            pricePerPhotoHnl={event.price_per_photo_hnl}
            whatsapp={event.whatsapp ?? ""}
            eventName={event.name}
          />
        </div>

        <div className="mt-12">
          <Link
            href={`/e/${event.slug}/results`}
            className="text-sm font-medium text-zinc-700 underline"
          >
            ¿Prefieres explorar todas las fotos? Ver galería completa →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
