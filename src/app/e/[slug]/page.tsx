"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRightIcon, CameraIcon, ImageIcon, UploadIcon } from "@radix-ui/react-icons";

import { Brand } from "@/components/brand";
import { Footer } from "@/components/footer";
import { useLensia } from "@/lib/local-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrivacyNote } from "@/components/public/privacy-note";
import { photoGradient } from "@/lib/photo";

function previewIdsFromSlug(slug: string) {
  return Array.from({ length: 6 }).map((_, i) => `pv_${slug}_${i + 1}`);
}

export default function PublicEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const { events, photos } = useLensia();
  const event = events.find((e) => e.slug === slug) ?? null;

  const eventPhotos = React.useMemo(
    () => photos.filter((p) => p.eventId === event?.id),
    [photos, event?.id]
  );

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

  const previewIds =
    eventPhotos.length > 0
      ? eventPhotos.slice(0, 6).map((p) => p.id)
      : previewIdsFromSlug(event.slug);

  return (
    <div className="flex min-h-full flex-col bg-white">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-8">
          <Brand />
          <Button asChild variant="secondary">
            <Link href="/dashboard">Soy fotografo</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          <div>
            <p className="text-sm text-zinc-700">Galeria publica</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              {event.name}
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-zinc-700">
              <span className="font-medium text-zinc-950">Encuentra tus fotos con una selfie</span>.
              Escaneamos tu rostro y buscamos coincidencias en el evento.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CameraIcon className="text-zinc-950" />
                    <CardTitle>Sube tu selfie</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-6">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-700">
                        <UploadIcon />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-zinc-950">Selecciona una selfie</p>
                        <p className="mt-1 text-xs text-zinc-700">
                          Privado: la selfie no se publica.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button variant="secondary" className="w-full">
                        Seleccionar selfie
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <PrivacyNote />
            </div>
          </div>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Buscar ahora</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full" size="lg">
                <Link href={`/e/${event.slug}/results`}>
                  Buscar mis fotos <ArrowRightIcon />
                </Link>
              </Button>
              <Button asChild variant="secondary" className="w-full" size="lg">
                <Link href={`/e/${event.slug}/results`}>
                  <ImageIcon /> Explorar galeria
                </Link>
              </Button>
              <p className="text-xs leading-5 text-zinc-500">
                Las fotos se muestran con watermark. Compra y entrega digital se integran pronto.
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="mt-12">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-zinc-950">Vista previa</h2>
              <p className="mt-1 text-sm text-zinc-700">Algunas fotos del evento.</p>
            </div>
            <Button asChild variant="ghost">
              <Link href={`/e/${event.slug}/results`}>
                Ver todas <ArrowRightIcon />
              </Link>
            </Button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {previewIds.map((id) => (
              <div key={id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                <div className="aspect-[4/3]" style={{ backgroundImage: photoGradient(id) }} />
                <div className="p-3">
                  <p className="text-sm font-semibold text-zinc-950">Foto</p>
                  <p className="mt-1 text-xs text-zinc-500">Watermark 4Tercios</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
