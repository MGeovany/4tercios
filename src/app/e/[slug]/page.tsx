import Link from "next/link";
import type { CSSProperties } from "react";

import { Brand } from "@/components/brand";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { SelfieSearch } from "@/components/search/selfie-search";
import { buildThemeCssVars } from "@/lib/branding";
import { getPublicEventPresentationBySlug } from "@/lib/server/events";
import { formatHnl } from "@/lib/currency";

/** Vibrant solid colors used as a per-event accent. */
const VIBRANT_ACCENTS = [
  "#ff5f00",
  "#ec4899",
  "#7c3aed",
  "#2563eb",
  "#06b6d4",
  "#16a34a",
  "#facc15",
  "#ef4444",
] as const;

export default async function PublicEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
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
  const brandFont = "manrope";
  const manropeFont = 'var(--font-manrope), "Manrope", system-ui, sans-serif';
  const watermarkStyle = "subtle" as const;
  const watermarkColor = "#ffffff";
  const watermarkLabel =
    event.photographers?.watermark_label ||
    event.photographers?.business_name ||
    "4Tercios";
  const watermarkFont = "sans" as const;
  const watermarkOpacity =
    typeof event.photographers?.watermark_opacity === "number"
      ? Math.max(0.02, Math.min(0.45, event.photographers.watermark_opacity))
      : 0.08;
  const watermarkDensity =
    typeof event.photographers?.watermark_density === "number"
      ? Math.max(0.4, Math.min(2.2, event.photographers.watermark_density))
      : 1;
  const accent = pickVibrantAccent(event.slug);

  return (
    <div
      className="bg-background text-foreground flex min-h-full flex-col"
      style={{ ...(themeVars as CSSProperties), fontFamily: manropeFont }}
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
        <section
          className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.02)]"
          style={{ borderTopWidth: 2, borderTopColor: accent }}
        >
          <div className="px-6 pt-8 pb-7 sm:px-10 sm:pt-10 sm:pb-9">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-medium tracking-[0.08em] text-zinc-700 uppercase">
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: accent }}
                  />
                  Encuentra tus fotos
                </span>
                <h1 className="mt-4 text-3xl leading-tight font-semibold tracking-tight text-zinc-950 sm:text-5xl">
                  {event.name}
                </h1>
                <p className="mt-2 text-sm text-zinc-500">
                  {dateStr}
                  {event.city ? ` · ${event.city}` : ""}
                  {event.venue ? ` · ${event.venue}` : ""}
                </p>
              </div>

              <dl className="shrink-0">
                <div>
                  <dt className="text-[11px] font-medium tracking-[0.12em] text-zinc-500 uppercase">
                    Precio por foto
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950 tabular-nums sm:text-4xl">
                    {formatHnl(event.price_per_photo_hnl)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          <div className="grid gap-2 border-t border-zinc-100 px-6 py-3.5 text-xs text-zinc-600 sm:grid-cols-3 sm:px-10">
            <p className="flex items-center gap-2">
              <Dot color={accent} /> Selfie privada y temporal
            </p>
            <p className="flex items-center gap-2">
              <Dot color={accent} /> Búsqueda automática con IA
            </p>
            <p className="flex items-center gap-2">
              <Dot color={accent} /> Compra 100% segura
            </p>
          </div>
        </section>

        <div className="mt-8">
          <SelfieSearch
            slug={event.slug}
            pricePerPhotoHnl={event.price_per_photo_hnl}
            whatsapp={event.whatsapp ?? ""}
            eventName={event.name}
            watermarkStyle={watermarkStyle}
            watermarkColor={watermarkColor}
            watermarkLabel={watermarkLabel}
            watermarkFont={watermarkFont}
            watermarkOpacity={watermarkOpacity}
            watermarkDensity={watermarkDensity}
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

function pickVibrantAccent(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return VIBRANT_ACCENTS[hash % VIBRANT_ACCENTS.length];
}

function Dot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="inline-block h-1.5 w-1.5 rounded-full"
      style={{ background: color }}
    />
  );
}
