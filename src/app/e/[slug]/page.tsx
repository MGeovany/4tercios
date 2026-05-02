import Link from "next/link";
import type { CSSProperties } from "react";

import { Brand } from "@/components/brand";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SelfieSearch } from "@/components/search/selfie-search";
import { buildThemeCssVars } from "@/lib/branding";
import { getPublicEventPresentationBySlug } from "@/lib/server/events";
import { formatHnl } from "@/lib/currency";

export default async function PublicEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getPublicEventPresentationBySlug(slug);

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

  const themeVars = buildThemeCssVars({
    paletteId: event.photographers?.theme_palette,
    primaryColor: event.photographers?.brand_color,
  });
  const brandFont = event.photographers?.theme_font ?? "inter";
  const watermarkStyle = (event.photographers?.watermark_style ?? "subtle") as
    | "none"
    | "subtle"
    | "bold";
  const watermarkColor = event.photographers?.watermark_color ?? "#ffffff";
  const watermarkLabel = event.photographers?.business_name || "4Tercios";
  const watermarkFont = (event.photographers?.watermark_font ?? "sans") as
    | "sans"
    | "serif"
    | "mono"
    | "display";

  return (
    <div
      className="bg-background text-foreground flex min-h-full flex-col"
      style={themeVars as CSSProperties}
      data-brand-font={brandFont}
    >
      <header className="border-b border-zinc-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-8">
          <Brand />
          <Button asChild variant="secondary">
            <Link href="/dashboard">Soy fotógrafo</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 lg:px-8">
        <section className="border-border bg-card overflow-hidden rounded-3xl border shadow-sm">
          <div className="bg-primary text-primary-foreground px-6 py-8 sm:px-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <Badge className="border-white/20 bg-white/10 text-white">Galería pública</Badge>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {event.name}
                </h1>
                <p className="text-primary-foreground/80 mt-2 text-sm">
                  {dateStr}
                  {event.city ? ` · ${event.city}` : ""}
                  {event.venue ? ` · ${event.venue}` : ""}
                </p>
              </div>
              <Card className="border-white/20 bg-white/10 text-white shadow-none backdrop-blur">
                <CardContent className="flex items-center gap-5 p-4">
                  <div className="min-w-28">
                    <p className="text-[11px] tracking-wide text-zinc-300 uppercase">
                      Precio por foto
                    </p>
                    <p className="mt-1 text-base font-semibold">
                      {formatHnl(event.price_per_photo_hnl)}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-white/20" />
                  <div className="min-w-20">
                    <p className="text-[11px] tracking-wide text-zinc-300 uppercase">Estado</p>
                    <p className="mt-1 text-base font-semibold">{event.status}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="grid gap-3 border-t border-zinc-100 bg-zinc-50/70 px-6 py-3 text-xs text-zinc-600 sm:grid-cols-3 sm:px-8">
            <p>Selfie privada y temporal</p>
            <p>Búsqueda automática con IA</p>
            <p>Compra por WhatsApp o pago online</p>
          </div>
        </section>

        <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <SelfieSearch
            slug={event.slug}
            pricePerPhotoHnl={event.price_per_photo_hnl}
            whatsapp={event.whatsapp ?? ""}
            eventName={event.name}
            watermarkStyle={watermarkStyle}
            watermarkColor={watermarkColor}
            watermarkLabel={watermarkLabel}
            watermarkFont={watermarkFont}
          />
        </div>

        <div className="mt-10">
          <Link
            href={`/e/${event.slug}/results`}
            className="text-sm font-medium text-zinc-700 underline underline-offset-4 hover:text-zinc-950"
          >
            ¿Prefieres explorar todas las fotos? Ver galería completa →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
