import Link from "next/link";
import { ChevronRightIcon, ExternalLinkIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";

import { requirePhotographer } from "@/lib/server/auth";
import { listExpiredEventsForPhotographer } from "@/lib/server/events";
import { Topbar } from "@/components/shell/topbar";
import { cn } from "@/lib/utils";
import type { EventStatus } from "@/lib/db/types";

const STATUS_BADGE: Record<EventStatus, string> = {
  Listo: "bg-emerald-50 text-emerald-700",
  Procesando: "bg-amber-50 text-amber-700",
  Subiendo: "bg-sky-50 text-sky-700",
  "Con errores": "bg-rose-50 text-rose-700",
  Borrador: "bg-zinc-100 text-zinc-700",
  Archivado: "bg-zinc-200 text-zinc-700",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-HN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${iso}T00:00:00`));
}

export default async function DashboardHistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePhotographer();
  const sp = await searchParams;
  const search = typeof sp.q === "string" ? sp.q : Array.isArray(sp.q) ? sp.q[0] : "";
  const expiredEvents = await listExpiredEventsForPhotographer({ search });

  return (
    <>
      <Topbar title="Historial" subtitle={`${expiredEvents.length} eventos caducados`} />

      <div className="mx-auto w-full max-w-5xl space-y-4 px-6 py-8">
        <form
          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-2"
          method="get"
        >
          <label className="relative min-w-0 flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Buscar eventos pasados..."
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white py-2 pr-3 pl-9 text-sm text-zinc-900 transition-colors outline-none placeholder:text-zinc-400 focus:border-zinc-900"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Buscar
          </button>
        </form>

        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {expiredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <p className="text-sm text-zinc-700">
                {search.trim()
                  ? `No se encontraron eventos caducados para "${search.trim()}".`
                  : "Aún no tienes eventos caducados."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {expiredEvents.map((event) => (
                <li key={event.id} className="group px-4 py-3 transition-colors hover:bg-zinc-50">
                  <div className="flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-zinc-950">{event.name}</p>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
                            STATUS_BADGE[event.status]
                          )}
                        >
                          {event.status}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {event.city ?? "—"} · {event.type} · Evento: {formatDate(event.date)}
                      </p>
                      <p className="mt-1 text-xs text-zinc-600">
                        Caducó: {formatDate(event.expires_at)} · Online {event.online_days} días ·
                        Hace {event.days_since_expired}{" "}
                        {event.days_since_expired === 1 ? "día" : "días"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/e/${event.slug}`}
                        target="_blank"
                        className="hidden text-zinc-400 hover:text-zinc-700 sm:inline-flex"
                        aria-label="Ver página pública"
                      >
                        <ExternalLinkIcon className="size-4" />
                      </Link>
                      <Link
                        href={`/dashboard/events/${event.id}/upload`}
                        className="inline-flex items-center text-zinc-400 transition-colors hover:text-zinc-700"
                        aria-label={`Abrir ${event.name}`}
                      >
                        <ChevronRightIcon className="size-4" />
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
