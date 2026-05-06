import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowLeftIcon } from "@radix-ui/react-icons";

import { Brand } from "@/components/brand";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { GalleryClient, type GalleryPhoto } from "@/components/search/gallery-client";
import { buildThemeCssVars } from "@/lib/branding";
import { getPublicEventPresentationBySlug } from "@/lib/server/events";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { thumbPublicUrl } from "@/lib/storage/paths";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { formatHnl } from "@/lib/currency";

const DATE_FORMATTER = new Intl.DateTimeFormat("es-HN", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const PAGE_SIZE = 60;

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

export default async function ResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
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

  const pageRaw =
    typeof sp.page === "string" ? sp.page : Array.isArray(sp.page) ? sp.page[0] : "1";
  const pageNum = Math.max(1, Number.parseInt(pageRaw ?? "1", 10) || 1);
  const from = (pageNum - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const admin = getSupabaseServiceClient();
  const env = getSupabaseEnv();
  const { data: photos, count: totalReady } = await admin
    .from("photos")
    .select("id, thumb_path, faces_count", { count: "exact" })
    .eq("event_id", event.id)
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .range(from, to);

  const gallery: GalleryPhoto[] = (photos ?? [])
    .filter((p) => p.thumb_path)
    .map((p) => ({
      photoId: p.id as string,
      facesCount: (p.faces_count as number) ?? 0,
      thumbUrl: thumbPublicUrl(env.url, p.thumb_path as string),
    }));

  const totalPhotos = totalReady ?? gallery.length;
  const totalPages = Math.max(1, Math.ceil(totalPhotos / PAGE_SIZE));
  const currentPage = Math.min(pageNum, totalPages);

  const dateStr = DATE_FORMATTER.format(new Date(`${event.date}T00:00:00`));
  const publishedAtStr = DATE_FORMATTER.format(new Date(event.created_at));
  const totalFaces = gallery.reduce((acc, p) => acc + p.facesCount, 0);
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
  const photographerName = event.photographers?.business_name ?? null;
  const rangeStart = (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(totalPhotos, currentPage * PAGE_SIZE);

  return (
    <div
      className="bg-background text-foreground flex min-h-full flex-col"
      style={{ ...(themeVars as CSSProperties), fontFamily: manropeFont }}
      data-brand-font={brandFont}
    >
      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden className="hidden h-5 w-px bg-zinc-200 sm:block" />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold text-zinc-950">{event.name}</p>
              <p className="truncate text-[11px] text-zinc-500">
                Galería · {dateStr}
                {event.city ? ` · ${event.city}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href={`/e/${event.slug}`}>
                <ArrowLeftIcon /> Buscar con selfie
              </Link>
            </Button>
            <Button asChild size="sm" className="sm:hidden">
              <Link href={`/e/${event.slug}`}>
                <ArrowLeftIcon /> Selfie
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 lg:px-8 lg:py-12">
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
                  Publicado · {publishedAtStr}
                </span>
                <h1 className="mt-4 text-3xl leading-tight font-semibold tracking-tight text-zinc-950 sm:text-5xl">
                  {event.name}
                </h1>
                <p className="mt-2 text-sm text-zinc-500">
                  {dateStr}
                  {event.city ? ` · ${event.city}` : ""}
                  {event.venue ? ` · ${event.venue}` : ""}
                </p>
                {photographerName ? (
                  <p className="mt-1 text-xs text-zinc-500">
                    Por{" "}
                    <span className="font-medium text-zinc-700">{photographerName}</span>
                  </p>
                ) : null}
              </div>

              <dl className="grid w-full grid-cols-3 gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 lg:w-auto">
                <Stat label="Fotos" value={totalPhotos.toLocaleString("es-HN")} />
                <Stat
                  label="Rostros"
                  value={totalFaces.toLocaleString("es-HN")}
                  hint="en esta página"
                />
                <Stat
                  label="Precio / foto"
                  value={formatHnl(event.price_per_photo_hnl)}
                  emphasis
                />
              </dl>
            </div>
          </div>

          <div className="grid gap-3 border-t border-zinc-100 px-6 py-4 sm:grid-cols-3 sm:px-10"></div>
        </section>

        <section className="mt-10">
          <header className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-200 pb-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
                Todas las fotos
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                {totalPhotos > 0
                  ? `Mostrando ${rangeStart.toLocaleString("es-HN")}–${rangeEnd.toLocaleString("es-HN")} de ${totalPhotos.toLocaleString("es-HN")}`
                  : "Aún no hay fotos disponibles"}
              </p>
            </div>
            <Link
              href={`/e/${event.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 underline-offset-4 hover:text-zinc-950 hover:underline"
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: accent }}
              />
              ¿Mucho que ver? Encuéntrate con un selfie
            </Link>
          </header>

          <div className="mt-6">
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
              <>
                <GalleryClient
                  photos={gallery}
                  eventSlug={event.slug}
                  eventName={event.name}
                  pricePerPhotoHnl={event.price_per_photo_hnl}
                  whatsapp={event.whatsapp ?? ""}
                  watermarkStyle={watermarkStyle}
                  watermarkColor={watermarkColor}
                  watermarkLabel={watermarkLabel}
                  watermarkFont={watermarkFont}
                  watermarkOpacity={watermarkOpacity}
                  watermarkDensity={watermarkDensity}
                />
                {totalPages > 1 ? (
                  <Pagination
                    slug={event.slug}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalPhotos={totalPhotos}
                    pageSize={PAGE_SIZE}
                  />
                ) : null}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  emphasis,
  hint,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  emphasis?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1 bg-white px-4 py-3 sm:px-5 sm:py-4">
      <dt className="flex items-center gap-1.5 text-[10px] font-medium tracking-widest text-zinc-500 uppercase">
        {icon}
        {label}
      </dt>
      <dd
        className={
          emphasis
            ? "text-lg font-semibold tracking-tight text-zinc-950 tabular-nums sm:text-xl"
            : "text-lg font-semibold tracking-tight text-zinc-950 tabular-nums"
        }
      >
        {value}
      </dd>
      {hint ? <p className="text-[10px] text-zinc-400">{hint}</p> : null}
    </div>
  );
}

function Pagination({
  slug,
  currentPage,
  totalPages,
  totalPhotos,
  pageSize,
}: {
  slug: string;
  currentPage: number;
  totalPages: number;
  totalPhotos: number;
  pageSize: number;
}) {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(totalPhotos, currentPage * pageSize);
  const prev = currentPage > 1 ? `/e/${slug}/results?page=${currentPage - 1}` : null;
  const next =
    currentPage < totalPages ? `/e/${slug}/results?page=${currentPage + 1}` : null;

  return (
    <nav
      aria-label="Paginación"
      className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-zinc-200 pt-6 sm:flex-row"
    >
      <p className="text-xs text-zinc-500">
        Mostrando{" "}
        <span className="font-medium text-zinc-900">
          {start.toLocaleString("es-HN")}–{end.toLocaleString("es-HN")}
        </span>{" "}
        de{" "}
        <span className="font-medium text-zinc-900">
          {totalPhotos.toLocaleString("es-HN")}
        </span>{" "}
        fotos
      </p>
      <div className="flex items-center gap-2">
        {prev ? (
          <Button asChild variant="secondary" size="sm">
            <Link href={prev}>← Anterior</Link>
          </Button>
        ) : (
          <Button variant="secondary" size="sm" disabled>
            ← Anterior
          </Button>
        )}
        <span className="text-xs text-zinc-600 tabular-nums">
          Página {currentPage} / {totalPages}
        </span>
        {next ? (
          <Button asChild variant="secondary" size="sm">
            <Link href={next}>Siguiente →</Link>
          </Button>
        ) : (
          <Button variant="secondary" size="sm" disabled>
            Siguiente →
          </Button>
        )}
      </div>
    </nav>
  );
}

function pickVibrantAccent(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return VIBRANT_ACCENTS[hash % VIBRANT_ACCENTS.length];
}
