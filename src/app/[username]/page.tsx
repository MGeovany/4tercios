import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Camera, Clock3, MapPin } from "lucide-react";
import { cookies } from "next/headers";

import { Brand } from "@/components/brand";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { formatHnl } from "@/lib/currency";
import {
  getPhotographerLikeSummary,
  getPublicPhotographerProfileByUsername,
} from "@/lib/server/public-profile";
import { PhotographerLikeButton } from "@/components/public/photographer-like-button";

const DATE_FMT = new Intl.DateTimeFormat("es-HN", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default async function PublicPhotographerPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getPublicPhotographerProfileByUsername(username);
  if (!profile) notFound();

  const cookieStore = await cookies();
  const viewerKey = cookieStore.get("profile_like_viewer")?.value ?? null;
  const likes = await getPhotographerLikeSummary(profile.photographer.id, viewerKey);

  return (
    <div className="bg-background text-foreground min-h-full">
      <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 lg:px-8">
          <Brand />
          <span className="text-xs font-medium text-zinc-500">@{profile.username}</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 lg:px-8 lg:py-10">
        <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white">
          <div className="grid gap-7 px-6 py-7 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <Badge variant="neutral">Perfil público</Badge>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
                {profile.photographer.business_name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-zinc-600">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4 text-zinc-400" />
                  Miembro desde {DATE_FMT.format(new Date(profile.photographer.created_at))}
                </span>
                {profile.photographer.whatsapp ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="size-4 text-zinc-400" />
                    WhatsApp: {profile.photographer.whatsapp}
                  </span>
                ) : null}
              </div>
            </div>
            <PhotographerLikeButton
              username={profile.username}
              initialMyClaps={likes.myClaps}
              initialTotalClaps={likes.totalClaps}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3 border-b border-zinc-200 pb-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
                Eventos activos
              </h2>
              <p className="text-xs text-zinc-500">
                Muestran miniatura y fotos disponibles para comprar.
              </p>
            </div>
            <span className="text-xs text-zinc-500">
              {profile.activeEvents.length} eventos
            </span>
          </div>

          {profile.activeEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-600">
              Este fotógrafo no tiene eventos activos por el momento.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.activeEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/${profile.username}/${event.slug}`}
                  className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-zinc-300"
                >
                  <div className="relative aspect-video bg-zinc-100">
                    {event.thumbUrl ? (
                      <Image
                        src={event.thumbUrl}
                        alt={event.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-zinc-400">
                        <Camera className="size-6" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    <p className="line-clamp-1 text-sm font-semibold text-zinc-950">{event.name}</p>
                    <p className="line-clamp-1 text-xs text-zinc-500">
                      {DATE_FMT.format(new Date(`${event.date}T00:00:00`))}
                      {event.city ? ` · ${event.city}` : ""}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600">
                        {event.photosReady.toLocaleString("es-HN")} fotos listas
                      </span>
                      <span className="font-medium text-zinc-900">
                        {formatHnl(event.price_per_photo_hnl)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3 border-b border-zinc-200 pb-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
                Historial
              </h2>
              <p className="text-xs text-zinc-500">
                Eventos caducados. Esta sección no muestra fotos.
              </p>
            </div>
            <span className="text-xs text-zinc-500">
              {profile.expiredEvents.length} eventos
            </span>
          </div>

          {profile.expiredEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-600">
              Sin eventos caducados.
            </div>
          ) : (
            <ul className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              {profile.expiredEvents.map((event, index) => (
                <li
                  key={event.id}
                  className={`px-5 py-4 ${index > 0 ? "border-t border-zinc-100" : ""}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900">{event.name}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="size-3.5" />
                          {DATE_FMT.format(new Date(`${event.date}T00:00:00`))}
                        </span>
                        {event.city ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3.5" />
                            {event.city}
                          </span>
                        ) : null}
                        <span>Caducó: {DATE_FMT.format(new Date(`${event.expiresAt}T00:00:00`))}</span>
                      </p>
                    </div>
                    <span className="text-xs font-medium text-zinc-700">
                      {formatHnl(event.price_per_photo_hnl)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

