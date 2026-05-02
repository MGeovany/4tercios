import Link from "next/link";
import { ChevronRightIcon, ExternalLinkIcon, PlusIcon } from "@radix-ui/react-icons";

import { listEventsForPhotographer } from "@/lib/server/events";
import { requirePhotographer } from "@/lib/server/auth";
import { cn } from "@/lib/utils";
import { Topbar } from "@/components/shell/topbar";
import { Button } from "@/components/ui/button";
import type { EventStatus } from "@/lib/db/types";
import { EventRowActions } from "./event-row-actions";

const STATUS_DOT: Record<EventStatus, string> = {
  Listo: "bg-emerald-500",
  Procesando: "bg-amber-500",
  Subiendo: "bg-sky-500",
  "Con errores": "bg-red-500",
  Borrador: "bg-zinc-300",
  Archivado: "bg-zinc-200",
};

function formatNumber(n: number) {
  return n.toLocaleString("es-HN");
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-HN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(`${iso}T00:00:00`));
}

export default async function EventsListPage() {
  await requirePhotographer();
  const events = await listEventsForPhotographer();

  return (
    <>
      <Topbar
        title="Eventos"
        subtitle={`${events.length} en total`}
        right={
          <Button size="sm" asChild>
            <Link href="/dashboard/events/new">
              <PlusIcon /> Nuevo evento
            </Link>
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <p className="text-sm text-zinc-700">Aún no tienes eventos.</p>
              <Button size="sm" asChild>
                <Link href="/dashboard/events/new">Crear mi primer evento</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {events.map((event) => (
                <li key={event.id}>
                  <div className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-zinc-50">
                    <span
                      aria-hidden
                      className={cn("size-2 shrink-0 rounded-full", STATUS_DOT[event.status])}
                    />
                    <Link
                      href={`/dashboard/events/${event.id}/upload`}
                      className="flex min-w-0 flex-1 items-center gap-4 focus-visible:outline-none"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-950 decoration-zinc-300 underline-offset-4 group-hover:underline">
                          {event.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-zinc-500">
                          {event.city ?? "—"} · {formatDate(event.date)} · {event.type} ·{" "}
                          {event.status}
                        </p>
                      </div>

                      <div className="hidden items-center gap-5 text-right sm:flex">
                        <div className="w-20">
                          <p className="text-sm font-medium text-zinc-950 tabular-nums">
                            {formatNumber(event.price_per_photo_hnl)}
                          </p>
                          <p className="text-xs text-zinc-500">HNL/foto</p>
                        </div>
                        <ChevronRightIcon className="size-4 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500" />
                      </div>
                    </Link>
                    <Link
                      href={`/e/${event.slug}`}
                      target="_blank"
                      className="hidden text-zinc-400 hover:text-zinc-700 sm:inline-flex"
                      aria-label="Ver página pública"
                    >
                      <ExternalLinkIcon className="size-4" />
                    </Link>
                    <EventRowActions eventId={event.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
